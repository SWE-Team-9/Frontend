"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/src/context/AuthContext";
import {FiSearch} from "react-icons/fi";
import { FaSoundcloud } from "react-icons/fa";

export default function LandingPage() {
  const { openAuth } = useAuth();
  const slides = [
    {
      image:
        "https://a-v2.sndcdn.com/assets/images/front-hero-artist-fan-534fb484.jpeg",
      title: "Discover. Get Discovered.",
      description:
        "Discover your next obsession, or become someone else’s.SoundCloud is the only community where fans and artists come together to discover and connect through music.",
      buttonText: "Get Started",
      buttonColor: "bg-white/90",
      secondaryLink: null,
    },
    {
      image:
        "https://a-v2.sndcdn.com/assets/images/front-hero-artist-db39c288.jpeg",
      title: "It all starts with an upload.",
      description:
        "From bedrooms and broom closets to studios and stadiums, SoundCloud is where you define what’s next in music. Just hit upload.",
      buttonText: "Upload",
      buttonColor: "bg-white/90",
      secondaryLink: "Explore Artist Pro",
    },
    {
      image:
        "https://a-v2.sndcdn.com/assets/images/front-hero-fan-7bdd78dc.jpeg",
      title: "Where every music scene lives.",
      description:
        "Discover 400 million songs, remixes and DJ sets: every chart-topping track you can find elsewhere, and millions more you can’t find anywhere else.",
      buttonText: " Upload",
      buttonColor: "bg-white/90",
      secondaryLink: "Explore Go+",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev: number) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    /* OUTER WRAPPER: Centers the content in the middle of the screen */
    <div className="w-full min-h-screen bg-[#111] flex flex-col items-center">
      {/* 80% CONTAINER: Provides the 10% margins on left and right */}
      <div className="w-[80%] flex flex-col">
        {/* --- HERO SECTION --- */}
        <section className="relative h-120 w-full bg-[#333] overflow-hidden mt-10 rounded-sm shadow-sm">
          {/* THE SLIDING LAYERS */}
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <div
                className="absolute inset-0 bg-cover bg-position-[center_top]"
                style={{ backgroundImage: `url('${slide.image}')` }}
              >
                <div className="absolute inset-0 bg-[#121212]/40"></div>
              </div>
              <div className="relative z-20 h-full flex flex-col justify-center items-start px-12 max-w-2xl text-white">
                <h1 className="text-5xl font-bold leading-tight mb-6">
                  {slide.title}
                </h1>
                <p className="text-xl leading-relaxed mb-8">
                  {slide.description}
                </p>
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => openAuth?.("signup")}
                    className={`${slide.buttonColor} text-black px-4 py-1.5 rounded-sm font-bold text-lg hover:brightness-110 transition-all cursor-pointer `}
                  >
                    {slide.buttonText}
                  </button>
                  {slide.secondaryLink && (
                    <a
                      href="#"
                      className="text-md text-white/90 font-bold  transition-colors cursor-pointer "
                    >
                      {slide.secondaryLink}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* --- STATIC HEADER (Stays on top of all slides) --- */}
          <div className="absolute top-0 left-0 w-full h-20 px-10 flex items-center justify-between z-30">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <FaSoundcloud size={40} />
              <span className="text-white font-semibold text-md uppercase">
                SoundCloud
              </span>
            </div>

            {/* Top Right Auth Buttons & Link */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => openAuth?.("login")}
                className="text-black text-sm font-medium border border-white/40 px-3 py-1.5 rounded-sm hover:text-gray-600 transition-colors bg-white cursor-pointer "
              >
                Sign in
              </button>
              <button
                onClick={() => openAuth?.("signup")}
                className="bg-black text-white text-sm font-bold px-3 py-1.5 rounded-sm hover:text-gray-600 transition-colors cursor-pointer"
              >
                Create account
              </button>
              <a
                href="/artists"
                target="_blank"
                className="text-white text-sm font-medium hover:text-white transition-colors cursor-pointer hidden md:block"
              >
                For Artists
              </a>
            </div>
          </div>

          {/* CAROUSEL DOTS */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 z-30">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "bg-white scale-125" : "bg-white/40"
                }`}
              ></div>
            ))}
          </div>
        </section>

        {/* --- SEARCHBAR SECTION --- */}
        <section className="py-8  mt-4 bg-dark flex justify-center">
          <div className="w-full max-w-4xl flex items-center gap-4">
            <div className="grow relative">
              <input
                type="text"
                placeholder="Search for artists, bands, tracks, podcasts"
                className="w-full bg-[#303030] px-4 py-3 rounded-sm text-slate-400 focus:ring-1 focus:ring-slate-300 outline-none transition-all border border-transparent"
              />
              {/* Using Font Awesome Icon */}
              <span className="absolute right-4 top-3.5 text-slate-400">
                <FiSearch size={20} />
              </span>
            </div>
            <span className="text-white font-medium text-lg">or</span>
            <button className="border border-slate-300 px-6 py-3 rounded-sm font-bold text-black hover:text-gray-700 transition-colors bg-white cursor-pointer ">
              Upload your own
            </button>
          </div>
        </section>

        {/* --- TRENDING TITLE --- */}
        <section className="pt-4 pb-10 text-center">
          <h2 className="text-2xl font-bold text-white">
            Hear what’s trending for free in the SoundCloud community
          </h2>
        </section>
      </div>
    </div>
  );
}
