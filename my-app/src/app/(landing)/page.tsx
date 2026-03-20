"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useRouter } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import { FaSoundcloud } from "react-icons/fa";

export default function LandingPage() {
  const { openAuth } = useAuth();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      buttonText: "Upload",
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
    <div className="w-full min-h-screen bg-[#111] flex flex-col items-center">
      <div className="w-full px-4 md:px-0 md:w-[90%] lg:w-[80%] flex flex-col">

        {/* HERO SECTION */}
        <section className="relative h-90 xs:h-[400px] md:h-120 w-full bg-[#333] overflow-hidden mt-6 md:mt-10 rounded-sm shadow-sm">

          {/* SLIDES */}
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {/* Background */}
              <div
                className="absolute inset-0 bg-cover bg-position-[center_top]"
                style={{ backgroundImage: `url('${slide.image}')` }}
              >
                <div className="absolute inset-0 bg-[#121212]/40"></div>
              </div>

              {/* Content */}
              <div className="relative z-20 h-full flex flex-col justify-center items-start px-4 md:px-12 max-w-2xl text-white">
                <h1 className="text-2xl xs:text-3xl md:text-5xl font-bold leading-tight mb-4 md:mb-6">
                  {slide.title}
                </h1>

                <p className="text-base xs:text-lg md:text-xl leading-relaxed mb-6 md:mb-8">
                  {slide.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 md:gap-6">
                  <button
                    onClick={() => openAuth?.("signup")}
                    className={`${slide.buttonColor} text-black px-6 py-1.5 rounded-sm font-bold text-sm md:text-lg hover:brightness-110 transition-all cursor-pointer`}
                  >
                    {slide.buttonText}
                  </button>

                  {slide.secondaryLink && (
                    <a
                      href="#"
                      className="text-xs xs:text-sm md:text-md text-white/90 font-bold transition-colors cursor-pointer"
                    >
                      {slide.secondaryLink}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* HEADER */}
          <div className="absolute top-0 left-0 w-full h-20 px-4 md:px-10 flex items-center justify-between z-40">
            {/* Logo */}
            <div className="flex items-center gap-2">
                <span className="text-white text-2xl font-bold italic">
                  <FaSoundcloud size={40} />
                </span>
              <span className="text-white font-semibold text-sm uppercase">
                SoundCloud
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden md:flex items-center gap-3">
                {user ? (
                  /* ── Logged in ─────────────────────────────────────── */
                  <>
                    <span className="text-white text-sm font-medium">
                      Hi, {user.displayName || user.handle || user.email.split("@")[0]}!
                    </span>
                    <button
                      onClick={() => router.push("/discover")}
                      className="bg-white text-black text-[10px] xs:text-xs md:text-sm font-bold px-3 py-1.5 rounded-sm cursor-pointer"
                    >
                      Go to Discover →
                    </button>
                  </>
                ) : (
                  /* ── Logged out ────────────────────────────────────── */
                  <>
                    <button
                      onClick={() => openAuth?.("login")}
                      className="text-black text-[10px] xs:text-xs md:text-sm font-medium border border-white/40 px-3 py-1.5 rounded-sm bg-white cursor-pointer"
                    >
                      Sign in
                    </button>

                    <button
                      onClick={() => openAuth?.("signup")}
                      className="bg-black text-white text-[10px] xs:text-xs md:text-sm font-bold px-3 py-1.5 rounded-sm cursor-pointer"
                    >
                      Create account
                    </button>

                    <a
                      href="/artists"
                      target="_blank"
                      className="text-white text-xs md:text-sm font-medium cursor-pointer"
                    >
                      For Artists
                    </a>
                  </>
                )}
              </div>

              {/* Burger */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white p-2 md:hidden cursor-pointer"
              >
                <div className="w-5 h-0.5 bg-white mb-1"></div>
                <div className="w-5 h-0.5 bg-white mb-1"></div>
                <div className="w-5 h-0.5 bg-white"></div>
              </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
              <div className="absolute top-20 left-0 w-full bg-[#111] border-t border-white/10 flex flex-col p-6 gap-4 md:hidden z-50">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="absolute top-1 right-1 text-gray-400 text-xl"
                >
                  ✕
                </button>

                {user ? (
                  /* ── Logged in (mobile) ─────────────────────────── */
                  <button
                    onClick={() => {
                      router.push("/discover");
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-white mt-4 text-black py-3 font-bold rounded-sm text-sm"
                  >
                    Go to Discover →
                  </button>
                ) : (
                  /* ── Logged out (mobile) ────────────────────────── */
                  <>
                    <button
                      onClick={() => {
                        openAuth?.("login");
                        setIsMenuOpen(false);
                      }}
                      className="w-full bg-white mt-4 text-black py-3 font-bold rounded-sm text-sm"
                    >
                      Sign In
                    </button>

                    <button
                      onClick={() => {
                        openAuth?.("signup");
                        setIsMenuOpen(false);
                      }}
                      className="w-full bg-black text-white py-3 font-bold rounded-sm border border-white/20 text-sm"
                    >
                      Create Account
                    </button>
                  </>
                )}

                <a
                  href="/artists"
                  target="_blank"
                  className="text-white/70 text-center text-sm py-2"
                >
                  For Artists
                </a>
              </div>
            )}
          </div>

          {/* DOTS */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 z-30">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentIndex ? "bg-white scale-125" : "bg-white/40"
                }`}
              ></div>
            ))}
          </div>
        </section>

        {/* SEARCH */}
        <section className="py-8 mt-4 flex justify-center">
          <div className="w-full max-w-4xl flex flex-col md:flex-row items-center gap-4">
            <div className="w-full relative">
              <input
                type="text"
                placeholder="Search for artists, bands, tracks, podcasts"
                className="w-full bg-[#303030] px-4 py-3 rounded-sm text-slate-400 outline-none border"
              />

              <span className="absolute right-4 top-3.5 text-slate-400">
                <FiSearch size={20} />
              </span>
            </div>
            <span className="text-white hidden md:block">or</span>

            <button className="border px-6 py-3 rounded-sm font-bold bg-white cursor-pointer text-black whitespace-nowrap">
              Upload your own
            </button>
          </div>
        </section>

        {/* TRENDING */}
        <section className="pt-4 pb-10 text-center">
          <h2 className="text-md xs:text-lg md:text-2xl font-bold text-white">
            Hear what’s trending for free in the SoundCloud community
          </h2>
        </section>

      </div>
    </div>
  );
}