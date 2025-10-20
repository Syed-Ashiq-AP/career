import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "./generated/prisma";
import { Polar } from "@polar-sh/sdk";
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
    socialProviders: {
        // github: {
        //     clientId: process.env.GITHUB_CLIENT_ID as string,
        //     clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        // },
    },
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
