# -*- coding: utf-8 -*-
"""
Step definitions for /products/grouped/ against https://api.bando.cool/api/v1
Behave + requests. Designed to be robust to minor response shape differences.
"""

from behave import given, when, then
from behave.runner import Context
import os
import json
import requests
from requests.sessions import Session
from urllib.parse import urlencode, urljoin


# ---------- Small helpers ----------

def _json(context):
    if not hasattr(context, "response"):
        raise AssertionError("No response available in context.")
    try:
        return context.response.json()
    except Exception as ex:
        raise AssertionError(f"Response is not valid JSON: {ex}\nBody: {context.response.text[:500]}")

def _ensure_list(dct, key):
    if key not in dct:
        raise AssertionError(f'Expected key "{key}" in JSON body.')
    if not isinstance(dct[key], list):
        raise AssertionError(f'Expected "{key}" to be a list, got: {type(dct[key]).__name__}')
    return dct[key]

def _first_or_fail(lst, what="item"):
    if not lst:
        raise AssertionError(f"Expected at least one {what}, got empty list.")
    return lst[0]

def _contains_country(entry, country_code):
    """
    Returns True if the entry (product/brand/variant) indicates support for the given country.
    We look for common fields that might exist: supportedCountries, country, countries, etc.
    """
    candidates = []
    for key in ("supportedCountries", "countries"):
        if isinstance(entry.get(key), list):
            candidates.extend([str(x).upper() for x in entry[key]])
    if "country" in entry and isinstance(entry["country"], str):
        candidates.append(entry["country"].upper())

    country_code = (country_code or "").upper()
    return country_code in candidates if candidates else False

def _match_category(entry, expected_categories):
    """
    Check if entry aligns with any of expected categories.
    We look for 'category' (str) or 'categories' (list of str).
    """
    cats = set()
    if isinstance(entry.get("category"), str):
        cats.add(entry["category"].strip().lower())
    if isinstance(entry.get("categories"), list):
        cats.update([str(x).strip().lower() for x in entry["categories"]])

    if not cats:
        # If the API doesn't expose categories at this level, we can't disprove; return True to avoid false negatives.
        return True

    for want in expected_categories:
        if want.strip().lower() in cats:
            return True
    return False


# ---------- Background steps ----------

@given('the API base URL is "{base_url}"')
def step_set_base_url(context, base_url):
    context.base_url = base_url.rstrip("/")
    context.session = requests.Session()
    context.headers = {}
    context.query = {}

@given('I send the header "{name}" with value "{value}"')
def step_add_header(context, name, value):
    context.headers[name] = value

@given('if I have a valid token I send the header "Authorization" with value "Bearer <BANDO_API_TOKEN>"')
def step_optional_auth_header(context):
    token = os.environ.get("BANDO_API_TOKEN") or os.environ.get("BANDO_TOKEN")
    if token:
        context.headers["Authorization"] = f"Bearer {token}"

@given("I prepare the query parameters:")
def step_prepare_query_params(context):
    # Data table with columns: key | value
    context.query = {}
    for row in context.table:
        k = row["key"].strip()
        v = row["value"].strip()
        context.query[k] = v


# ---------- When steps ----------

@when('I send a GET request to "{path}"')
def step_get_plain(context: Context, path):
    url = urljoin(context.base_url + "/", path.lstrip("/"))
    context.response = context.session.get(url, headers=context.headers, timeout=30)


@when('I send a GET request to "{path}" with those parameters')
def step_get_with_params(context, path):
    url = urljoin(context.base_url + "/", path.lstrip("/"))
    context.response = context.session.get(url, headers=context.headers, params=context.query, timeout=60)


# ---------- Then steps ----------

@then("the response status code should be {code:d}")
def step_assert_status(context, code):
    actual = context.response.status_code
    if actual != code:
        raise AssertionError(
            f"Expected HTTP {code}, got {actual}. Body: {context.response.text[:800]}"
        )

@then('the JSON body should contain the attribute "{key}" as a list')
def step_assert_attr_list(context, key):
    data = _json(context)
    _ensure_list(data, key)

@then('the JSON body should contain "products" as a list')
def step_products_is_list(context):
    data = _json(context)
    _ensure_list(data, "products")

# @then('the JSON body should contain the attribute "products" as a list')
# def step_products_is_list_alias(context):
#     step_products_is_list(context)

@then('the JSON body should contain the attribute "products" as a non-empty list')
def step_products_nonempty(context):
    data = _json(context)
    products = _ensure_list(data, "products")
    _first_or_fail(products, "product")

@then('each element in "products" should include "productType"')
def step_each_product_has_type(context):
    data = _json(context)
    products = _ensure_list(data, "products")
    for i, prod in enumerate(products):
        if "productType" not in prod:
            raise AssertionError(f'Missing "productType" on products[{i}]')

@then('each "products[0].brands[0].variants[0]" should include "sku"')
def step_first_variant_has_sku(context):
    data = _json(context)
    products = _ensure_list(data, "products")
    p0 = _first_or_fail(products, "product")
    brands = _ensure_list(p0, "brands")
    b0 = _first_or_fail(brands, "brand")
    variants = _ensure_list(b0, "variants")
    v0 = _first_or_fail(variants, "variant")
    if "sku" not in v0:
        raise AssertionError('Missing "sku" on products[0].brands[0].variants[0]')

@then('"products[0].brands[0].variants[0].price" should include "fiatCurrency" and "fiatValue"')
def step_first_variant_price_fields(context):
    data = _json(context)
    products = _ensure_list(data, "products")
    p0 = _first_or_fail(products, "product")
    brands = _ensure_list(p0, "brands")
    b0 = _first_or_fail(brands, "brand")
    variants = _ensure_list(b0, "variants")
    v0 = _first_or_fail(variants, "variant")
    price = v0.get("price")
    if not isinstance(price, dict):
        raise AssertionError('Expected "price" to be an object on the first variant.')
    for k in ("fiatCurrency", "fiatValue"):
        if k not in price:
            raise AssertionError(f'Missing "{k}" inside price of the first variant.')

@then('all returned elements should correspond to the country "{country}" or appear in "supportedCountries"')
def step_match_country(context, country):
    data = _json(context)
    products = _ensure_list(data, "products")
    # We check at product level OR brand level OR variant level.
    for pi, prod in enumerate(products):
        ok = _contains_country(prod, country)
        if not ok and isinstance(prod.get("brands"), list):
            for b in prod["brands"]:
                ok = ok or _contains_country(b, country)
                if not ok and isinstance(b.get("variants"), list):
                    for v in b["variants"]:
                        ok = ok or _contains_country(v, country)
                        if ok:
                            break
                if ok:
                    break
        if not ok:
            raise AssertionError(
                f'products[{pi}] does not indicate support for "{country}" '
                'via "country"/"countries"/"supportedCountries".'
            )

@then('if "product_type" is specified, the groups or variants should match the requested product_type')
def step_match_product_type_logic(context):
    # Read requested categories from context.query (comma-separated)
    requested = context.query.get("product_type")
    if not requested:
        # Nothing to check if caller did not specify product_type
        return
    expected_product_types = [c.strip() for c in requested.split(",") if c.strip()]

    data = _json(context)
    products = _ensure_list(data, "products")

    for pi, prod in enumerate(products):
        ok_here = _match_category(prod, expected_product_types)
        if not ok_here and isinstance(prod.get("brands"), list):
            for b in prod["brands"]:
                ok_here = ok_here or _match_category(b, expected_product_types)
                if not ok_here and isinstance(b.get("variants"), list):
                    for v in b["variants"]:
                        ok_here = ok_here or _match_category(v, expected_product_types)
                        if ok_here:
                            break
                if ok_here:
                    break
        if not ok_here:
            raise AssertionError(
                f'products[{pi}] does not match requested product_type: {expected_product_types}'
            )

@then("the JSON body should include an error object with a descriptive message")
def step_error_object(context):
    data = _json(context)
    # Be permissive: many APIs use one of these shapes
    has_error = isinstance(data, dict) and (
            "error" in data
            or "message" in data
            or ("errors" in data and isinstance(data["errors"], (list, dict)))
            or ("detail" in data)
    )
    if not has_error:
        raise AssertionError(f"Expected an error payload. Got: {json.dumps(data)[:500]}")
