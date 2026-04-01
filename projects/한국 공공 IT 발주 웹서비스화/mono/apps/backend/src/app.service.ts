import { Injectable } from "@nestjs/common";
import { APIResponse, API_RESPONSE_CODES } from "@shared/types";

@Injectable()
export class AppService {
  getHealth(): APIResponse<{ status: string }> {
    return {
      code: API_RESPONSE_CODES.SUCCESS,
      message: "Health check passed",
      result: { status: "ok" },
    };
  }
}
