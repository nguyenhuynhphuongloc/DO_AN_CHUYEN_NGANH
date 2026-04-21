import { badRequest, json, serverError } from "../lib/http.js";

export function createResourceController({ resourceType, repository, requiredFields = [] }) {
  return {
    list: async (request, response) => {
      try {
        const rows = await repository.listResource(resourceType, request.userId);
        json(response, 200, { data: rows });
      } catch (error) {
        console.error(error);
        serverError(response, `Unable to list ${resourceType}.`);
      }
    },

    create: async (request, response) => {
      const missing = requiredFields.filter((field) => request.body[field] === undefined || request.body[field] === "");
      if (missing.length) {
        badRequest(response, "INVALID_PAYLOAD", "Missing required fields.", { missing_fields: missing });
        return;
      }

      try {
        const row = await repository.createResource(resourceType, request.userId, request.body);
        json(response, 201, { data: row });
      } catch (error) {
        console.error(error);
        serverError(response, `Unable to create ${resourceType}.`);
      }
    },

    update: async (request, response) => {
      try {
        const row = await repository.updateResource(
          resourceType,
          request.userId,
          request.params.id,
          request.body
        );

        if (!row) {
          badRequest(response, "INVALID_PAYLOAD", "No updatable fields supplied or record not found.");
          return;
        }

        json(response, 200, { data: row });
      } catch (error) {
        console.error(error);
        serverError(response, `Unable to update ${resourceType}.`);
      }
    }
  };
}
