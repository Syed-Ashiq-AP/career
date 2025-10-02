import { useEvaluator } from "@/components/providers/career-evaluation-provider";
import React from "react";
import Suggest from "./suggest";
import Survey from "./survey";

const AiView = () => {
    const evaluatorContext = useEvaluator();

    const { careers } = evaluatorContext;

    return careers ? <Suggest careers={careers} /> : <Survey />;
};

export default AiView;
