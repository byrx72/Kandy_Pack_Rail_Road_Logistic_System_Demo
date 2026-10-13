"use client";

import { useEffect, useRef, useState } from "react";
import { CountUp } from "./Reveal";

interface HeroVideoProps {
  productCount: number;
  routeCount: number;
  loading: boolean;
}

export default function HeroVideo({ productCount, routeCount, loading }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {
      // Autoplay with audio is blocked by browsers, but video is muted so this is safe fallback
      setIsPlaying(false);
    });
  }, []);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  return (
    <section className="video-hero-container">
      {/* Real Background Video */}
      <div className="video-background-wrap">
        <video
          ref={videoRef}
          className="video-background-media"
          autoPlay
          loop
          muted
          playsInline
          poster="/brand/distribution-hero.png"
        >
          <source src="/videos/train-hero.webm" type="video/webm" />
          <source src="/videos/train-hero-mobile.webm" type="video/webm" />
        </video>
        {/* Cinematic ambient layers & vignette */}
        <div className="video-overlay-gradient" />
        <div className="video-scanlines" />
      </div>

      {/* Hero Foreground Content */}
      <div className="video-hero-content">
        <div className="video-hero-badge-row">
          <span className="live-pill">
            <i />
            <span>LIVE NETWORK · KANDY → ISLANDWIDE FREIGHT</span>
          </span>
          <button
            type="button"
            className="video-control-pill"
            onClick={togglePlayback}
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            {isPlaying ? "❚❚ Pause Motion" : "▶ Play Motion"}
          </button>
        </div>

        <h1 className="video-hero-title">
          <span className="title-row">Everyday essentials.</span>
          <span className="title-row accent-gradient">Always in motion.</span>
        </h1>

        <p className="video-hero-subtitle">
          Islandwide wholesale distribution connecting Sri Lanka by scheduled freight rail and regional road fleets. Coordinated from Kandy with guaranteed seven-day delivery windows.
        </p>

        <div className="video-hero-actions">
          <a href="#catalog" className="primary-link">
            Browse the catalogue <span aria-hidden="true">→</span>
          </a>
          <a href="/orders" className="ghost-link">
            Track active orders
          </a>
        </div>

        {/* Live Network Statistics */}
        <div className="video-hero-metrics">
          <div className="metric-card">
            <span className="metric-label">Active Catalogue</span>
            <strong className="metric-value">
              {loading ? "—" : <CountUp value={productCount} />}
            </strong>
            <span className="metric-detail">Available FMCG items</span>
          </div>

          <div className="metric-card">
            <span className="metric-label">Transit Routes</span>
            <strong className="metric-value">
              {loading ? "—" : <CountUp value={routeCount} />}
            </strong>
            <span className="metric-detail">Rail & Road corridors</span>
          </div>

          <div className="metric-card">
            <span className="metric-label">Scheduled Lead Time</span>
            <strong className="metric-value">
              7 <span className="metric-unit">Days</span>
            </strong>
            <span className="metric-detail">Guaranteed dispatch</span>
          </div>

          <div className="metric-card">
            <span className="metric-label">Transport Fleet</span>
            <strong className="metric-value">
              Rail <span className="metric-unit">+ Road</span>
            </strong>
            <span className="metric-detail">Direct from Kandy Hub</span>
          </div>
        </div>
      </div>

      {/* Subtle bottom scroll cue */}
      <a href="#journey" className="scroll-cue" aria-label="Scroll down to delivery journey">
        <span />
      </a>
    </section>
  );
}
