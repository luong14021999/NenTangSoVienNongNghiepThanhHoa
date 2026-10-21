"use client";

import { createAuthClient } from "@neondatabase/auth/next";

// Mọi request auth đi qua /api/auth/[...path] (proxy sang Neon Auth).
export const authClient = createAuthClient();
