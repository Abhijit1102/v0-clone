"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetProjects } from "@/module/project/hooks/project";
import Link from "next/link";
import React from "react";
import { ArrowRight, Calendar, FolderKanban } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export default function ProjectList() {
    const { data: projects, isPending } = useGetProjects();
    
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    if (isPending) {
        return (
            <div className="w-full mt-16">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-zinc-900 dark:text-zinc-100">
                    Your Projects
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-36 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!projects || projects.length === 0) {
        return null;
    }

    return (
        <div className="w-full mt-16">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-zinc-900 dark:text-zinc-100">
                Your Projects
            </h2>

            {/* Desktop Grid View */}
            <div className="hidden lg:grid grid-cols-3 gap-4 max-w-6xl mx-auto">
                {projects.map((project) => (
                    <Link href={`/projects/${project.id}`} key={project.id}>
                        <Card className="group hover:shadow-xl transition-all duration-300 border-zinc-200 dark:border-zinc-800/50 hover:border-emerald-500/50 cursor-pointer bg-white dark:bg-zinc-900/30 backdrop-blur-sm overflow-hidden">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-2.5 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                                        <FolderKanban className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                </div>
                                <CardTitle className="text-lg text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                                    {project.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center text-sm text-zinc-600 dark:text-zinc-400">
                                    <Calendar className="w-3.5 h-3.5 mr-2" />
                                    <span>{formatDate(project.createdAt)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Mobile/Tablet Carousel View */}
            <div className="lg:hidden max-w-4xl mx-auto px-4">
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-4">
                        {projects.map((project) => (
                            <CarouselItem key={project.id} className="pl-4 md:basis-1/2">
                                <Link href={`/projects/${project.id}`}>
                                    <Card className="group hover:shadow-xl transition-all duration-300 border-zinc-200 dark:border-zinc-800/50 hover:border-emerald-500/50 cursor-pointer bg-white dark:bg-zinc-900/30 backdrop-blur-sm">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="p-2.5 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                                                    <FolderKanban className="w-5 h-5 text-emerald-500" />
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                            </div>
                                            <CardTitle className="text-lg text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                                                {project.name}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center text-sm text-zinc-600 dark:text-zinc-400">
                                                <Calendar className="w-3.5 h-3.5 mr-2" />
                                                <span>{formatDate(project.createdAt)}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100" />
                    <CarouselNext className="border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100" />
                </Carousel>
            </div>
        </div>
    );
}