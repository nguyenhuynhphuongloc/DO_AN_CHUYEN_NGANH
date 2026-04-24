## MODIFIED Requirements

### Requirement: The module includes local run and integration documentation
The system SHALL document how to run the OCR backend flow, frontend review module, `auth-service`, and `finance-service` together in local development, and that documentation SHALL define the Docker-based full-system startup flow as using service-local auth and finance database env files for Neon-backed persistence.

#### Scenario: Developer follows local setup documentation
- **WHEN** a developer reads the module documentation
- **THEN** they can configure root Docker env plus the `auth-service` and `finance-service` env files, start the supported services through the documented Docker local stack, and identify the OCR and finance transaction endpoints needed for manual testing
