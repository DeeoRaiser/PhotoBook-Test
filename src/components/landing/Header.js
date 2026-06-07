"use client";

import { useState } from "react";
import { LogIn, UserPlus, Menu, X } from "lucide-react";

/**
 * Header — barra de navegación fija con efecto scroll y menú mobile.
 *
 * Props:
 *   scrolled  {boolean}  – true cuando window.scrollY > 40
 */
export default function Header({ scrolled }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    ["Funcionalidades", "#funcionalidades"],
    ["Galerías", "#galerias"],
    ["Plataforma", "#plataforma"],
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] flex justify-between items-center transition-all duration-500 ${
        scrolled
          ? "bg-[rgba(240,247,255,0.96)] backdrop-blur-[16px] border-b border-[rgba(42,127,212,0.2)] shadow-[0_4px_24px_rgba(42,127,212,0.08)] px-12 py-4"
          : "px-12 py-6"
      }`}
    >
      {/* ── Logo ── */}
      <div
        className="flex items-center gap-3 font-extrabold text-[1.3rem] tracking-[-0.02em] text-[#0f2a4a]"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Logo de PhotoBook — plataforma para fotógrafos profesionales"
          className="w-12 object-cover object-top brightness-90 contrast-105 saturate-110 block"
        />
        PhotoBook
      </div>

      {/* ── Nav ── */}
      <nav aria-label="Navegación principal">
        {/* Desktop */}
        <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
          {navLinks.map(([label, href]) => (
            <li key={label}>
              <a
                href={href}
                className="
                  relative text-[#4a7096] text-[0.82rem] tracking-[0.08em] uppercase
                  no-underline transition-all duration-300 hover:text-[#0f2a4a]
                  after:content-[''] after:absolute after:left-0 after:-bottom-1
                  after:w-0 after:h-[2px] after:bg-[#2a7fd4]
                  after:transition-all after:duration-300
                  hover:after:w-full
                "
              >
                {label}
              </a>
            </li>
          ))}

          <li>
            <a
              href="/register"
              className="
                inline-flex items-center
                bg-gradient-to-r from-[#1a4a7a] to-[#2a7fd4]
                text-white px-6 py-2.5 text-[0.78rem]
                tracking-[0.1em] uppercase rounded-lg no-underline
                shadow-md shadow-blue-500/20
                transition-all duration-300
                hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30
                hover:from-[#215b96] hover:to-[#3a8fff]
              "
            >
              <UserPlus className="mr-1" size={16} strokeWidth={2.2} />
              Registrarse
            </a>
          </li>

          <li>
            <a
              href="/dashboard"
              className="
                inline-flex items-center
                text-[#1a4a7a] border border-[#1a4a7a]
                px-5 py-2.5 text-[0.78rem] tracking-[0.1em] uppercase
                rounded-lg no-underline transition-all duration-300
                hover:bg-[#1a4a7a] hover:text-white
                hover:shadow-md hover:shadow-blue-500/20
              "
            >
              <LogIn className="mr-1" size={16} strokeWidth={2.2} />
              Ingresar
            </a>
          </li>
        </ul>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          className="
            md:hidden flex items-center justify-center
            w-11 h-11 rounded-xl
            border border-[#d6e4f2]
            bg-white/80 backdrop-blur-md
            text-[#1a4a7a]
            shadow-sm
          "
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile drawer */}
        <div
          className={`
            fixed top-0 right-0 h-screen w-[85%] max-w-[340px]
            bg-white z-50
            shadow-2xl shadow-black/20
            transition-transform duration-300 ease-in-out
            md:hidden
            ${menuOpen ? "translate-x-0" : "translate-x-full"}
          `}
        >
          <div className="flex items-center justify-between p-6 border-b border-[#eef4fa]">
            <span className="text-[#1a4a7a] font-semibold tracking-wide">Menú</span>
            <button onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" className="text-[#1a4a7a]">
              <X size={24} />
            </button>
          </div>

          <div className="flex flex-col p-6 gap-5">
            {navLinks.map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="
                  text-[#1a4a7a]
                  uppercase tracking-[0.08em]
                  text-sm font-medium
                  py-2 border-b border-[#eef4fa]
                "
              >
                {label}
              </a>
            ))}

            <a
              href="/register"
              className="
                mt-4 inline-flex items-center justify-center
                bg-gradient-to-r from-[#1a4a7a] to-[#2a7fd4]
                text-white px-6 py-3
                rounded-xl uppercase tracking-[0.08em]
                shadow-md
              "
            >
              <UserPlus className="mr-2" size={18} />
              Registrarse
            </a>

            <a
              href="/dashboard"
              className="
                inline-flex items-center justify-center
                border border-[#1a4a7a]
                text-[#1a4a7a]
                px-6 py-3 rounded-xl
                uppercase tracking-[0.08em]
              "
            >
              <LogIn className="mr-2" size={18} />
              Ingresar
            </a>
          </div>
        </div>

        {/* Mobile overlay */}
        {menuOpen && (
          <div
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
          />
        )}
      </nav>
    </header>
  );
}
