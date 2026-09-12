# Product Requirements Document (PRD)

Project Name: T-NOB AI (Texture Nodes for Blender)  
Document Version: 1.0  
Target Release: MVP (Web Playground)  
Status: Approved  

---

## 1. Executive Summary & Value Proposition

T-NOB AI is an AI-powered procedural material generator purpose-built for Blender 4.x. Instead of generating flat, static 2D bitmap image textures (albedo, roughness, normal maps) that consume excessive storage and demand fixed UV unwrap coordinates, T-NOB AI translates natural-language prompts directly into optimized Blender Python (bpy) shader node scripts.

### Core Value Drivers
* Zero Storage Footprint: Replaces multi-gigabyte 4K/8K image texture archives with lightweight, 2 KB procedural Python scripts.
* Resolution Independence: Algorithmic textures scale infinitely without pixelation or compression artifacts at extreme camera macro distances.
* Non-Destructive Node Workflows: Users retain complete structural control inside Blender's Shader Editor to tweak variables (noise scale, color ramps, roughness thresholds, voronoi metrics) after generation.
* Zero Asset Hosting Costs: Eliminates the necessity for expensive cloud file storage systems or high-bandwidth distribution pipelines.

---

## 2. Target Personas & User Stories

### Target Personas
* Indie 3D Artists & Stylized Creators: Require rapid surface generation (stylized clay, toon outlines, painted armor) without tedious manual node routing.
* Technical Artists & Environment Designers: Require scalable procedural surface graphs (cracked pavement, weathered stone, procedural moss) that preserve viewport memory and render performance.
* Game Developers (Low-Poly / Prototype): Require lightweight material pipelines to prototype looks before final texture baking.

### Key User Stories
* As an artist, I want to enter a prompt such as "weathered sci-fi titanium hull with orange paint chipping and dirt in crevices" and receive ready-to-run code in under 3 seconds.
* As a technical user, I want the generated script to follow modern Blender 4.x standards (Principled BSDF v2 socket conventions) without syntax errors or deprecated nodes.
* As a user operating on a zero-budget setup, I want to copy the script with a single click and run it inside Blender's native Text Editor without purchasing third-party software.

---

## 3. System Architecture & Technical Specifications

+--------------------------------------------------------------------+
|                          T-NOB AI Frontend                         |
|  - Prompt Input Box           - Style / Preset Filters             |
|  - Syntax-Highlighted Viewer  - 1-Click Clipboard & .py Exporter   |
+---------------------------------+----------------------------------+
                                  |
                                  | JSON Payload: { prompt, style }
                                  v
+--------------------------------------------------------------------+
|                    Backend API (Flask / Node.js)                   |
|  - System Prompt Construction   - Rate Limiting & Auth Check       |
|  - AST Syntax & Safety Linter   - Socket Graph Output Clean-up     |
+---------------------------------+----------------------------------+
                                  |
                                  | Structured Instruction
                                  v
+--------------------------------------------------------------------+
|               Inference Layer (Google Gemini 2.5 Flash)            |
|  - Blender 4.x bpy Schema       - Procedural Graph Logic           |
+--------------------------------------------------------------------+

### Technical Stack (Free-Tier Optimized)
* Frontend: Clean HTML5, CSS3, and Vanilla JavaScript hosted on Vercel or GitHub Pages.
* Backend: Flask (Python) or Node.js (Express) hosted on Render Web Services or Vercel Serverless Functions.
* LLM Engine: Google Gemini 2.5 Flash API via Google AI Studio for fast, low-latency, structured code output.
* Database (Phase 2): MongoDB Atlas (M0 Free Tier) for storing saved user prompts and community material presets.

---

## 4. Functional Requirements

### 4.1 Web Client Interface
* Input Field: Multi-line text input supporting natural language descriptions, aesthetic modifiers, and color references.
* Preset Selector: Quick-filter tags for common material genres:
  - Metals (Brushed Aluminum, Hammered Bronze, Rust)
  - Stylized (Flat Toon, Halftone, Claymorphism)
  - Organics (Reptile Scales, Sliced Citrus, Alien Chitin)
  - Terrain & ArchViz (Cracked Asphalt, Marble Veins, Polished Concrete)
* Code Output Workspace: Monospace code block displaying the generated Python script with clean line numbers and syntax formatting.
* Export Utilities:
  - Copy Code: Copies the generated script to the system clipboard with immediate visual confirmation.
  - Download .py: Triggers a file download saved as tnob_<material_name>.py.
* Execution Guide: Compact reference guide outlining the three execution steps in Blender (Scripting workspace -> New Text -> Run Script).

### 4.2 Backend & Code Sanitization Layer
* Prompt Engineering Protocol: Strict injection of Blender 4.x node rules:
  - Must utilize nodes.new(type="...") syntax.
  - Must enforce updated BSDF socket names (e.g., Base Color, Roughness, Metallic, IOR, Subsurface Weight).
  - Automatic node coordinate offsetting (node.location = (x, y)) so that generated graphs remain untangled in the Shader Editor.
* Output Sanitizer: Automatically strips markdown code fences (```python ... ```), raw backticks, and explanatory text.
* Validation & Safety Check:
  - Runs Python AST verification to ensure syntax integrity.
  - Verifies presence of mandatory nodes (ShaderNodeOutputMaterial, ShaderNodeBsdfPrincipled).
  - Blocks unauthorized modules (e.g., os, sys, subprocess, requests, socket).

---

## 5. Non-Functional Requirements

* Performance: End-to-end generation latency must remain under 3.5 seconds under typical network conditions.
* Reliability: Code execution success rate inside Blender 4.0, 4.1, and 4.2 must achieve 95% or higher on standard procedural queries.
* Zero Cost: The entire infrastructure must operate inside the free execution quotas of the selected hosting and API providers during initial rollout.
* Security: API endpoints must implement IP-based rate limiting (e.g., 10 requests per IP per minute) to prevent quota depletion. Generated code is strictly confined to the bpy library.

---

## 6. Phased Implementation Roadmap

### Phase 1: Web MVP Launch
* Finalize Gemini 2.5 Flash system prompts and socket connection rules.
* Launch responsive web playground with prompt inputs, code viewer, and copy/download controls.
* Test 50 distinct procedural material outputs across standard Blender test meshes (Monkey/Suzanne, UV Sphere, Shader Ball).

### Phase 2: Blender Companion Add-on
* Develop an open-source Python .zip add-on integrated into Blender's 3D Viewport N-panel.
* Enable direct communication with the backend API to generate and assign shader trees without leaving Blender.

### Phase 3: Interactive Preview & Community Library
* Integrate a WebGL/Three.js procedural sphere preview within the web interface.
* Launch a community library where users can share prompts, view node trees, and vote on community presets.