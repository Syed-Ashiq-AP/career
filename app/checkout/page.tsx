"use client";
import NumberFlow from "@number-flow/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sparkles, ArrowRight, Check, Star, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const plans = [
  {
    id: "free",
    name: "Free",
    icon: Star,
    price: "Free forever",
    description:
      "Perfect for exploring career options with our AI chatbot guidance.",
    features: [
      "Unlimited AI career chat",
      "Career guidance & advice",
      "Job market insights",
      "Learning resources",
      "Basic career tips",
    ],
    cta: "Continue for free",
  },
  {
    id: "e499263e-3d21-4904-a5ee-9e6f440be007",
    name: "Premium",
    icon: Zap,
    price: 100,
    description:
      "Complete career assessment with personalized AI survey recommendations.",
    features: [
      "Everything in Free plan",
      "AI career survey & evaluation",
      "Personalized career suggestions",
      "Detailed match percentages",
      "Priority career guidance",
    ],
    cta: "Unlock AI Survey",
    currentPlan: "Thank you for your purchase!",
    popular: true,
  },
];

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [orderIDs, setOrderIDs] = useState<string[]>([]);
  const router = useRouter();

  const { data: session } = authClient.useSession();

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!session) return;
    const fetch = async () => {
      const { data } = await authClient.customer.orders.list({
        query: {
          page: 1,
          limit: 10,
        },
      });
      if (!data) return;
      const { items } = data.result;
      const orders = items.map((item: any) => item.productId);
      setOrderIDs(orders);
    };
    fetch();
  }, [session]);
  if (!mounted) return null;

  const handlePurchase = async (id: string) => {
    if (id === "free") {
      // For free plan, just redirect to the main app
      router.push("/");
      return;
    }
    await authClient.checkout({ products: [id] });
  };

  return (
    <div className="h-full not-prose relative flex w-full flex-col gap-16 overflow-y-auto px-4 py-24 text-center sm:px-8">
      <div className="absolute inset-0 -z-10 overflow-hidden hidden md:block">
        <div className="bg-primary/10 absolute -top-[10%] left-[50%] h-[40%] w-[60%] -translate-x-1/2 rounded-full blur-3xl" />
        <div className="bg-primary/5 absolute -right-[10%] -bottom-[10%] h-[40%] w-[40%] rounded-full blur-3xl" />
        <div className="bg-primary/5 absolute -bottom-[10%] -left-[10%] h-[40%] w-[40%] rounded-full blur-3xl" />
      </div>

      <div className="flex flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center space-y-2">
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/5 mb-4 rounded-full px-4 py-1 text-sm font-medium"
          >
            <Sparkles className="text-primary mr-1 h-3.5 w-3.5 animate-pulse" />
            Pricing Plans
          </Badge>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="from-foreground to-foreground/30 bg-gradient-to-b bg-clip-text text-4xl font-bold text-transparent sm:text-5xl"
          >
            Pick the perfect plan for your career journey
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground max-w-md pt-2 text-lg"
          >
            Start with free AI career guidance, or unlock personalized career
            assessment for deeper insights.
          </motion.p>
        </div>

        <div className="mt-8 grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.1 + index * 0.1,
              }}
              whileHover={{ y: -5 }}
              className="flex"
            >
              <Card
                className={cn(
                  "bg-secondary/20 relative h-full w-full text-left transition-all duration-300 hover:shadow-lg",
                  plan.popular
                    ? "ring-primary/50 dark:shadow-primary/10 shadow-md ring-2"
                    : "hover:border-primary/30",
                  plan.popular &&
                    "from-primary/[0.03] bg-gradient-to-b to-transparent"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 right-0 left-0 mx-auto w-fit">
                    <Badge className="bg-primary text-primary-foreground rounded-full px-4 py-1 shadow-sm">
                      <Sparkles className="mr-1 h-3.5 w-3.5" />
                      Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className={cn("pb-4", plan.popular && "pt-8")}>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        plan.popular
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-foreground"
                      )}
                    >
                      <plan.icon className="h-4 w-4" />
                    </div>
                    <CardTitle
                      className={cn(
                        "text-xl font-bold",
                        plan.popular && "text-primary"
                      )}
                    >
                      {plan.name}
                    </CardTitle>
                  </div>
                  <CardDescription className="mt-3 space-y-2">
                    <p className="text-sm">{plan.description}</p>
                    <div className="pt-2">
                      {typeof plan.price === "number" ? (
                        <div className="flex items-baseline">
                          <NumberFlow
                            className={cn(
                              "text-3xl font-bold",
                              plan.popular ? "text-primary" : "text-foreground"
                            )}
                            format={{
                              style: "currency",
                              currency: "INR",
                              maximumFractionDigits: 0,
                            }}
                            value={plan.price}
                          />
                          <span className="text-muted-foreground ml-1 text-sm">
                            one-time payment
                          </span>
                        </div>
                      ) : (
                        <span
                          className={cn(
                            "text-2xl font-bold",
                            plan.popular ? "text-primary" : "text-foreground"
                          )}
                        >
                          {plan.price}
                        </span>
                      )}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 pb-6 h-full">
                  {plan.features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: 0.5 + index * 0.05,
                      }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full",
                          plan.popular
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary text-secondary-foreground"
                        )}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span
                        className={
                          plan.popular
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {feature}
                      </span>
                    </motion.div>
                  ))}
                </CardContent>
                <CardFooter>
                  {session ? (
                    orderIDs.includes(plan.id) && plan.currentPlan ? (
                      <p className="w-full text-center font-medium">
                        {plan.currentPlan}
                      </p>
                    ) : (
                      <Button
                        variant={plan.popular ? "default" : "outline"}
                        className={cn(
                          "w-full font-medium transition-all duration-300",
                          plan.popular
                            ? "bg-primary hover:bg-primary/90 hover:shadow-primary/20 hover:shadow-md"
                            : "hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                        )}
                        onClick={() => handlePurchase(plan.id)}
                      >
                        {plan.cta}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </Button>
                    )
                  ) : (
                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      className={cn(
                        "w-full font-medium transition-all duration-300",
                        plan.popular
                          ? "bg-primary hover:bg-primary/90 hover:shadow-primary/20 hover:shadow-md"
                          : "hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                      )}
                      onClick={() => handlePurchase(plan.id)}
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Button>
                  )}
                </CardFooter>

                {/* Subtle gradient effects */}
                {plan.popular ? (
                  <>
                    <div className="from-primary/[0.05] pointer-events-none absolute right-0 bottom-0 left-0 h-1/2 rounded-b-lg bg-gradient-to-t to-transparent" />
                    <div className="border-primary/20 pointer-events-none absolute inset-0 rounded-lg border" />
                  </>
                ) : (
                  <div className="hover:border-primary/10 pointer-events-none absolute inset-0 rounded-lg border border-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
