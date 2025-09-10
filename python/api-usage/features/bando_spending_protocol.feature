# language: en
@api @products
Feature: Retrieve grouped products
  In order to know which products I can offer in my app
  As a Bando integrator
  I want to get the list of products via the `/products/grouped/` endpoint

  Background:
    Given the API base URL is "https://api.bando.cool/api/v1"
    And I send the header "Accept" with value "application/json"
    And if I have a valid token I send the header "Authorization" with value "Bearer <BANDO_API_TOKEN>"

  Scenario: Retrieve catalog without filters
    When I send a GET request to "/products/grouped/"
    Then the response status code should be 200
    And the JSON body should contain the attribute "products" as a list
    And each element in "products" should include "productType"
    And each "products[0].brands[0].variants[0]" should include "sku"
    And "products[0].brands[0].variants[0].price" should include "fiatCurrency" and "fiatValue"

  @filters
  Scenario Outline: Filter by country and product type
    Given I prepare the query parameters:
      | key     | value          |
      | country | <country>      |
      | type    | <product_type> |
    When I send a GET request to "/products/grouped/" with those parameters
    Then the response status code should be 200
    And the JSON body should contain "products" as a list
    And if "product_type" is specified, the groups or variants should match the requested product_type
    Examples:
      | country | product_type |
      | MX      | topup        |
      | US      | gift_card    |
      | AR      | esim         |