import { NextResponse } from "next/server";

export function apiResponse<T>(success: boolean, data: T, message = "Operation successful", status = 200) {
  return NextResponse.json(
    {
      success,
      data,
      message,
    },
    { status }
  );
}

export function apiError(message = "Something went wrong", status = 500) {
  return NextResponse.json(
    {
      success: false,
      data: null,
      message,
    },
    { status }
  );
}
