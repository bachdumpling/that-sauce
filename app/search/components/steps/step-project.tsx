"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface StepProjectProps {
  projectDescription: string;
  onDescriptionChange: (description: string) => void;
  selectedRole: string;
}

// Role-specific example prompts
const ROLE_SPECIFIC_PROMPTS: Record<string, string[]> = {
  Director: [
    "minimalist and monochromatic director who specializes in 35mm film cameras",
    "director with experience in narrative-driven commercials with emotional storytelling",
    "experimental film director with a focus on surreal and dreamlike visuals",
  ],
  Photographer: [
    "fashion photographer experienced in high-contrast black and white editorials",
    "documentary photographer with experience capturing authentic moments in remote locations",
    "product photographer specializing in luxury jewelry with dramatic lighting",
  ],
  Cinematographer: [
    "cinematographer with experience in handheld, naturalistic lighting for indie films",
    "cinematographer who specializes in anamorphic lenses and widescreen compositions",
    "cinematographer with experience shooting moody, atmospheric night scenes with minimal lighting",
  ],
  "Motion Designer": [
    "motion designer specializing in bold, geometric animations with vibrant colors",
    "3D motion designer with experience in abstract, fluid simulations",
    "motion designer focusing on typography-driven animations for brand campaigns",
  ],
  "Graphic Designer": [
    "graphic designer with a clean, minimalist aesthetic and strong typography skills",
    "brand identity designer with experience in luxury fashion and beauty industries",
    "editorial graphic designer with a bold, experimental approach to layouts",
  ],
  Illustrator: [
    "illustrator with a whimsical, character-driven style for children's content",
    "digital illustrator specializing in detailed, realistic portraits with vibrant colors",
    "conceptual illustrator with experience in editorial and publishing work",
  ],
  "Art Director": [
    "art director with experience in high-end fashion campaigns and editorial shoots",
    "art director specializing in immersive retail experiences and visual merchandising",
    "art director with a strong background in digital campaigns for luxury brands",
  ],
  "Creative Director": [
    "creative director with experience developing cohesive brand identities for startups",
    "creative director specializing in innovative, sustainable packaging design",
    "creative director with a background in interactive digital experiences and installations",
  ],
  "3D Artist": [
    "3D artist specializing in hyperrealistic product visualizations with dramatic lighting",
    "character-focused 3D artist with a stylized, animated aesthetic",
    "architectural 3D artist with experience in photorealistic interior and exterior renderings",
  ],
  "UI/UX Designer": [
    "UI/UX designer with experience in creating minimal, intuitive interfaces for mobile apps",
    "UI designer specializing in data visualization and complex dashboard design",
    "UX designer focusing on accessibility and inclusive design principles",
  ],
  "Web Designer": [
    "web designer with expertise in responsive, content-first layouts with minimal aesthetics",
    "e-commerce focused web designer with experience in luxury retail websites",
    "interactive web designer specializing in immersive, experimental web experiences",
  ],
  "Fashion Designer": [
    "sustainable fashion designer specializing in upcycled materials and zero-waste patterns",
    "avant-garde fashion designer with architectural, sculptural garment construction",
    "fashion designer focusing on gender-neutral streetwear with artistic prints",
  ],
  "Product Designer": [
    "product designer with experience in minimalist, functional furniture design",
    "consumer tech product designer specializing in sustainable materials and manufacturing",
    "packaging designer focusing on innovative, eco-friendly solutions for food and beverage",
  ],
  "VFX Artist": [
    "VFX artist specializing in photo-realistic environment extensions and set modifications",
    "creature and character VFX artist with experience in motion capture integration",
    "VFX artist focusing on dynamic simulations like fire, water, and destruction effects",
  ],
  "Video Editor": [
    "narrative-driven video editor with experience in documentary and commercial work",
    "fast-paced editor specializing in dynamic social media content with graphic overlays",
    "video editor with expertise in color grading and visual effects integration",
  ],
  "Sound Designer": [
    "sound designer with experience creating immersive audio environments for documentaries",
    "experimental sound designer specializing in abstract, textural soundscapes",
    "sound designer focusing on realistic sound effects and foley for commercials",
  ],
  Animator: [
    "2D animator with a hand-drawn, illustrative style for explainer videos",
    "stop-motion animator specializing in tactile, textural animation with mixed media",
    "character animator with experience in expressive, personality-driven animation",
  ],
  "Production Designer": [
    "production designer with experience in creating stylized, period-accurate sets",
    "minimalist production designer specializing in contemporary, architectural spaces",
    "production designer focusing on immersive, fantastical environments for commercials",
  ],
  "Set Designer": [
    "set designer with experience in creating bold, colorful installations for fashion shoots",
    "architectural set designer specializing in clean, geometric compositions",
    "experiential set designer focusing on interactive, tactile environments",
  ],
  Stylist: [
    "fashion stylist with experience in editorial and high-fashion campaigns",
    "prop stylist specializing in food photography with a clean, minimal aesthetic",
    "wardrobe stylist focusing on sustainable fashion and vintage sourcing",
  ],
  "Makeup Artist": [
    "editorial makeup artist specializing in bold, avant-garde looks for fashion",
    "SFX makeup artist with experience in creature design and prosthetics",
    "beauty makeup artist focusing on natural, glowing skin and subtle enhancements",
  ],
  "Storyboard Artist": [
    "storyboard artist with experience in dynamic action sequences for commercials",
    "conceptual storyboard artist specializing in visual storytelling for brand narratives",
    "detailed storyboard artist focusing on mood and lighting for cinematic directors",
  ],
};

// Default prompts for any role not specifically defined
const DEFAULT_PROMPTS = [
  "creative with a minimal, monochromatic style who specializes in brand identity",
  "experienced professional focusing on vibrant, colorful compositions with bold typography",
  "innovative artist with a focus on sustainable and eco-friendly project approaches",
];

export function StepProject({
  projectDescription,
  onDescriptionChange,
  selectedRole,
}: StepProjectProps) {
  // Get example prompts for the selected role
  const getRoleExamples = (role: string) => {
    return ROLE_SPECIFIC_PROMPTS[role] || DEFAULT_PROMPTS;
  };

  const handleExampleClick = (example: string) => {
    onDescriptionChange(example);
  };

  const examples = getRoleExamples(selectedRole);

  return (
    <div className="grid grid-cols-5 gap-16 h-full items-center">
      {/* Left side - Illustration and heading (2 columns) */}
      <div className="col-span-2 flex flex-col items-center justify-center h-full">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Describe your project</h2>
          <p className="text-gray-600">
            Tell us what you're looking for in natural language
          </p>
        </div>
        <img
          src="/search-images/search-2.png"
          alt="Project description illustration"
          className="max-w-sm w-full h-auto"
        />
      </div>

      {/* Right side - Content (3 columns) */}
      <div className="col-span-3 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="mb-6">
            <Textarea
              placeholder={examples[0]}
              value={projectDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="min-h-[120px] text-base border-2 border-gray-200 focus:border-black resize-none"
            />
          </div>

          {/* Example prompts */}
          {!projectDescription && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Try searching for:
              </p>
              <div className="flex flex-wrap gap-2">
                {examples.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="text-sm bg-secondary/50 h-auto py-2 px-3 text-left"
                    onClick={() => handleExampleClick(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
