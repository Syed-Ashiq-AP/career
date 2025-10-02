"use client";
import { useEffect, useState, useRef } from "react";

interface UseScrollVisibilityProps {
    threshold?: number;
    rootMargin?: string;
}

export const useScrollVisibility = ({
    threshold = 0.5,
    rootMargin = "0px",
}: UseScrollVisibilityProps = {}) => {
    const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
    const [topMostVisible, setTopMostVisible] = useState<string | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const elementsRef = useRef<Map<string, Element>>(new Map());

    useEffect(() => {
        if (!observerRef.current) {
            observerRef.current = new IntersectionObserver(
                (entries) => {
                    const newVisibleItems = new Set(visibleItems);

                    entries.forEach((entry) => {
                        const elementId =
                            entry.target.getAttribute("data-message-id");
                        if (!elementId) return;

                        if (entry.isIntersecting) {
                            newVisibleItems.add(elementId);
                        } else {
                            newVisibleItems.delete(elementId);
                        }
                    });

                    setVisibleItems(newVisibleItems);

                    // Find the topmost visible element
                    if (newVisibleItems.size > 0) {
                        const visibleElements = Array.from(newVisibleItems)
                            .map((id) => ({
                                id,
                                element: elementsRef.current.get(id),
                            }))
                            .filter((item) => item.element)
                            .sort((a, b) => {
                                const aRect =
                                    a.element!.getBoundingClientRect();
                                const bRect =
                                    b.element!.getBoundingClientRect();
                                return aRect.top - bRect.top;
                            });

                        if (visibleElements.length > 0) {
                            setTopMostVisible(visibleElements[0].id);
                        }
                    } else {
                        setTopMostVisible(null);
                    }
                },
                {
                    threshold,
                    rootMargin,
                }
            );
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
        };
    }, [threshold, rootMargin, visibleItems]);

    const observe = (element: Element, messageId: string) => {
        if (!element || !observerRef.current) return;

        elementsRef.current.set(messageId, element);
        element.setAttribute("data-message-id", messageId);
        observerRef.current.observe(element);
    };

    const unobserve = (messageId: string) => {
        const element = elementsRef.current.get(messageId);
        if (element && observerRef.current) {
            observerRef.current.unobserve(element);
            elementsRef.current.delete(messageId);
        }
    };

    return {
        visibleItems,
        topMostVisible,
        observe,
        unobserve,
    };
};
