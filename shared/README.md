# Shared Database Contract Layer

This directory serves as the inter-intern contract layer for the HimShakti Traceability project.
It contains the single source of truth for the shared MongoDB Atlas cluster schemas and constants.

## THE ONE RULE THAT MUST EXIST

> **Any change to the products collection schema — adding, removing, or renaming a field — requires a written message to the other intern with 24 hours notice before the change is made in Atlas. No exceptions.**

Without this rule, the shared folder is just decoration. With this rule, it is a real contract.
