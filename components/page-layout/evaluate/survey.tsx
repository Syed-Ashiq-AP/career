import React, { useCallback, useEffect, useState } from "react";
import OptionButton from "@/components/page-layout/evaluate/option-button";
import QuestionPagination from "@/components/page-layout/evaluate/pagination";
import Image from "next/image";
import {
  Question,
  useEvaluator,
} from "@/components/providers/career-evaluation-provider";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface OptionImage {
  url: string;
  keyword: string;
}

// Cache for storing option images
const imageCache = new Map<string, OptionImage>();

// Helper to get/set cache with localStorage persistence
const getCachedImage = (option: string): OptionImage | null => {
  if (imageCache.has(option)) {
    return imageCache.get(option)!;
  }
  try {
    const cached = localStorage.getItem(`img_${option}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      imageCache.set(option, parsed);
      return parsed;
    }
  } catch (e) {
    console.error("Cache read error:", e);
  }
  return null;
};

const setCachedImage = (option: string, image: OptionImage) => {
  imageCache.set(option, image);
  try {
    localStorage.setItem(`img_${option}`, JSON.stringify(image));
  } catch (e) {
    console.error("Cache write error:", e);
  }
};

const Survey = () => {
  const evaluatorContext = useEvaluator();

  const {
    submitTimer,
    startTimer,
    answers,
    getQuestion,
    currentQuestion,
    setCurrentQuestion,
  } = evaluatorContext;

  const [toBeAnswered, setToBeAnswered] = useState<Question | null>(null);

  const [hasAnswered, setHasAnswered] = useState(false);

  const [optionImages, setOptionImages] = useState<Record<string, OptionImage>>(
    {}
  );
  const [loadingImages, setLoadingImages] = useState(false);

  useEffect(() => {
    setHasAnswered(false);
    const newPage = answers.length + 1;
    setCurrentPageNum(newPage);
  }, [answers]);

  // Fetch keywords and images when question changes
  useEffect(() => {
    const fetchImagesForOptions = async () => {
      if (!currentQuestion?.options) return;

      // Check cache first
      const cachedImages: Record<string, OptionImage> = {};
      const uncachedOptions: string[] = [];

      currentQuestion.options.forEach((option) => {
        const cached = getCachedImage(option);
        if (cached) {
          cachedImages[option] = cached;
        } else {
          uncachedOptions.push(option);
        }
      });

      // If all images are cached, use them immediately
      if (uncachedOptions.length === 0) {
        setOptionImages(cachedImages);
        setLoadingImages(false);
        return;
      }

      // Set cached images immediately while loading new ones
      if (Object.keys(cachedImages).length > 0) {
        setOptionImages(cachedImages);
      }

      setLoadingImages(true);
      try {
        // Get keywords from AI for uncached options
        const keywordsResponse = await fetch("/api/career-ai/keywords", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ options: uncachedOptions }),
        });

        if (!keywordsResponse.ok) {
          throw new Error("Failed to fetch keywords");
        }

        const { keywords } = await keywordsResponse.json();

        // Fetch images from our images API
        const imagesResponse = await fetch("/api/career-ai/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keywords }),
        });

        if (!imagesResponse.ok) {
          throw new Error("Failed to fetch images");
        }

        const { images } = await imagesResponse.json();

        // Map images to uncached options and cache them
        const newImages: Record<string, OptionImage> = {};
        uncachedOptions.forEach((option, index) => {
          const imageData = {
            url: images[index]?.url || "/temp.png",
            keyword: keywords[index] || option,
          };
          newImages[option] = imageData;
          setCachedImage(option, imageData);
        });

        // Combine cached and new images
        setOptionImages({ ...cachedImages, ...newImages });
      } catch (error) {
        console.error("Error fetching images:", error);
        // Fallback to default images for uncached options
        const fallbackImages: Record<string, OptionImage> = { ...cachedImages };
        uncachedOptions.forEach((option) => {
          fallbackImages[option] = {
            url: "/temp.png",
            keyword: option,
          };
        });
        setOptionImages(fallbackImages);
      } finally {
        setLoadingImages(false);
      }
    };

    fetchImagesForOptions();
  }, [currentQuestion]);

  const [currentPageNum, setCurrentPageNum] = useState(1);

  const setCurrentPage = (page: number) => {
    setCurrentPageNum(page);
  };

  const handlePageChange = useCallback(
    (page: number) => {
      if (!setCurrentQuestion) return;
      if (!toBeAnswered) setToBeAnswered(currentQuestion);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { answer: _, ...question } = answers[page - 1] ?? toBeAnswered;
      setCurrentQuestion(question);
    },
    [answers, setCurrentQuestion, currentQuestion, toBeAnswered]
  );

  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const select = useCallback(
    (option: string) => {
      setSelectedOption(option === selectedOption ? null : option);
    },
    [selectedOption]
  );

  const answered = useCallback(async () => {
    if (!getQuestion || !selectedOption) return;
    setHasAnswered(true);
    await getQuestion(
      selectedOption,
      currentPageNum <= answers.length ? currentPageNum - 1 : undefined
    );
    startTimer();

    setToBeAnswered(null);
  }, [getQuestion, currentPageNum, answers, startTimer, selectedOption]);

  return (
    currentQuestion && (
      <>
        <div className="sm:w-[500px] sm:min-h-[650px] rounded-lg border bg-neutral-900 flex flex-col p-4 space-y-4">
          <div className="p-2 bg-accent rounded w-fit text-sm">
            Q{currentPageNum}
          </div>
          <h2 className="text-xl font-bold">{currentQuestion?.question}</h2>
          <div className="grid grid-cols-2 gap-1">
            {currentQuestion?.options.map((option, i) => {
              const hasImage = optionImages[option]?.url;
              return hasImage ? (
                <OptionButton
                  onClick={() => select(option)}
                  className={cn(
                    selectedOption === option && "ring-2 ring-accent",
                    " w-full aspect-square h-auto"
                  )}
                  disabled={hasAnswered}
                  key={i}
                  backgroundImage={optionImages[option]?.url}
                >
                  {option}
                </OptionButton>
              ) : (
                <Skeleton
                  key={i}
                  className="w-full aspect-square rounded-[9px]"
                />
              );
            })}
          </div>
          <OptionButton
            onClick={() => {
              answered();
            }}
            disabled={!!submitTimer || !selectedOption || hasAnswered}
            className="mt-5 bg-accent"
          >
            Submit
            {submitTimer !== null && ` (${submitTimer}s)`}
          </OptionButton>
        </div>
        <div className="fixed bottom-0">
          <QuestionPagination
            currentPage={currentPageNum}
            setCurrentPage={setCurrentPage}
            totalPages={answers.length + 1}
            onPageChange={handlePageChange}
          />
        </div>
      </>
    )
  );
};

export default Survey;
