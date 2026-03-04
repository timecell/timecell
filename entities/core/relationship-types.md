# Entity Relationship Types

Entities connect to each other through typed relationships.

## Relationship Types

### owner
The entity or person who owns/controls this entity.
- Example: "John Smith" owns "Fidelity Brokerage Account"
- Cardinality: Many entities can have the same owner

### beneficiary
The entity or person who benefits from this entity.
- Example: "Smith Family Trust" has beneficiary "Jane Smith"
- Cardinality: An entity can have multiple beneficiaries

### trustee
The entity or person who manages a trust entity.
- Example: "Smith Family Trust" has trustee "John Smith"
- Cardinality: An entity can have multiple trustees

### custodian
The entity that holds/safeguards assets.
- Example: "BTC Holdings" custodied at "Coinbase"
- Cardinality: An asset can have one custodian

### advisor
A professional who provides guidance on this entity.
- Example: "Estate Plan" advised by "Jane Attorney"
- Cardinality: An entity can have multiple advisors

### parent
An entity that contains or controls this entity.
- Example: "Holding Company" is parent of "Operating Company"
- Cardinality: An entity has at most one parent

### sibling
Entities at the same level under the same parent.
- Example: Two trusts under the same family structure

## Usage in Entity Files

In the Relationships section of an entity file:
- owner: [[Entity Name]]
- custodian: [[Entity Name]]
- beneficiary: [[Entity Name]]

Use wikilink syntax to enable linking.
