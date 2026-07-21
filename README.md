# TalentFlow AI 🤖📋

**An AI-powered Applicant Tracking System (ATS) and recruitment CRM that automates 
resume screening, candidate-job matching, and hiring analytics for HR teams and 
staffing agencies.**

## Overview

TalentFlow AI helps recruiters manage the entire hiring lifecycle — candidates, 
clients, job postings, and pipelines — from a single dashboard, while using AI to 
do the heavy lifting that normally eats up recruiter hours: reading resumes, 
comparing them against job requirements, and ranking applicants by fit.

Instead of manually screening hundreds of resumes, recruiters get AI-generated 
compatibility scores, skill-gap insights, and natural-language candidate search 
(e.g. *"Java developer with Spring Boot and React experience in Pune"*).

## Key Features

- 🔐 **JWT Authentication & Role-Based Access Control** (Admin / Recruiter)
- 👥 **Candidate, Client & Job Management** with search, filter, sort, and pagination
- 🧠 **AI Resume Parsing** — extracts skills, education, certifications, and experience from uploaded resumes
- 🎯 **AI Candidate–Job Matching** — semantic compatibility scoring with rationale (matched/missing skills)
- 🔎 **Natural Language Candidate Search** — query candidates in plain English
- 📊 **Skill Gap Detection** — flags missing skills and suggests certifications
- 🧬 **Duplicate Candidate Detection** using similarity matching
- 🗂️ **Full Recruitment Pipeline Tracking** — Applied → Screening → Interview → Technical Round → HR Round → Offer → Hired
- 📈 **Recruitment Analytics Dashboard** — conversion rates, pipeline bottlenecks, recruiter performance, AI-generated hiring insights
- 🕵️ **Audit Logging** for all key recruitment actions
- 📱 **Responsive Dashboard UI**

## Tech Stack

**Frontend:** React.js, Tailwind CSS, React Router, Axios  
**Backend:** Java Spring Boot (Controller–Service–Repository architecture), Spring Security, JWT, Spring Data JPA / Hibernate  
**Database:** MySQL  
**AI/NLP:** Resume parsing & semantic matching powered by LLM-based analysis (NLP + ML for candidate scoring, skill extraction, and hiring predictions)  
**Architecture:** RESTful client–server design with a dedicated AI service layer for resume analysis and recommendations

## Status

🚧 Actively in development — built in phases (Foundation → Pipeline → AI Parsing → AI Matching & Search → Analytics & Polish).
