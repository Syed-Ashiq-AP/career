import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { Polar } from "@polar-sh/sdk";
import { PrismaClient } from "./generated/prisma/client";

import { polar, checkout, portal } from "@polar-sh/better-auth";

const polarClient = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN as string,
});
const prisma = new PrismaClient();

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "mongodb",
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {},
    plugins: [
        polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            use: [
                checkout({
                    products: [
                        {
                            productId: "e499263e-3d21-4904-a5ee-9e6f440be007",
                            slug: "Career-Agent",
                        },
                    ],
                    successUrl: process.env.POLAR_SUCCESS_URL,
                    authenticatedUsersOnly: true,
                }),
                portal(),
            ],
        }),
    ],
});
