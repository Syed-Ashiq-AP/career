import React from "react";
import { motion } from "motion/react";
import { Button } from "./Button";
import { TextAnimate } from "../ui/text-animate";
import { ShiftCard } from "../ui/shift-card";

const CareerCard = ({
  career,
  rank,
  match,
  description,
  onGuide,
  isLoading,
}: {
  career: string;
  rank: number;
  match: number;
  isLoading: boolean;
  description: string;
  onGuide: (career: string) => Promise<void>;
}) => {
  const topContent = (
    <div className="p-2 bg-accent/90 rounded-md text-primary shadow-[0px_1px_1px_0px_rgba(0,0,0,0.05),0px_1px_1px_0px_rgba(255,252,240,0.5)_inset,0px_0px_0px_1px_hsla(0,0%,100%,0.1)_inset,0px_0px_1px_0px_rgba(28,27,26,0.5)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_0_0_1px_rgba(255,255,255,0.03)_inset,0_0_0_1px_rgba(0,0,0,0.1),0_2px_2px_0_rgba(0,0,0,0.1),0_4px_4px_0_rgba(0,0,0,0.1),0_8px_8px_0_rgba(0,0,0,0.1)]">
      <TextAnimate text={career} className="text-lg" type="whipIn" />
    </div>
  );

  const rankText = <TextAnimate text={`#${rank}`} type="rollIn" />;

  const topAnimateContent = (
    <motion.div
      layoutId={rank.toString()}
      className="absolute top-2 right-2 shadow-lg text-xl"
      transition={{ duration: 0.3, ease: "circIn" }}
    >
      {rankText}
    </motion.div>
  );

  const middleContent = (
    <motion.div
      layoutId={rank.toString()}
      transition={{ duration: 0.3, ease: "circIn" }}
      className="absolute m-auto top-0 bottom-0 left-0 right-0 w-fit h-fit text-7xl"
    >
      {rankText}
    </motion.div>
  );

  const bottomContent = (
    <div className="pb-4">
      <div className="flex w-full flex-col gap-1 bg-primary/90 border-t border-t-black/10 rounded-t-lg px-4 pb-4  ">
        <div className="font-sans text-[14px] font-medium text-white dark:text-[#171717] flex gap-1 pt-2.5 items-center">
          <p>
            <b>Match Rate: </b>
            {match}%
          </p>
        </div>
        <div className="w-full text-pretty font-sans text-[13px] leading-4 text-neutral-200 dark:text-[#171717] pb-2 h-26 overflow-auto  ">
          {description}
        </div>

        <Button
          // loading={isLoading}
          onClick={async () => {
            await onGuide(career);
          }}
        >
          Guide
        </Button>
      </div>
    </div>
  );

  return (
    <ShiftCard
      topContent={topContent}
      topAnimateContent={topAnimateContent}
      middleContent={middleContent}
      bottomContent={bottomContent}
    />
  );
};

export default CareerCard;
