import { SearchWizard } from "./components/search-wizard";

const TALENT_ROLES = [
  "Director",
  "Photographer",
  "Cinematographer",
  "Motion Designer",
  "Illustrator",
  "Graphic Designer",
  "Video Editor",
  "VFX Artist",
  "3D Artist",
  "UI/UX Designer",
  "Art Director",
  "Creative Director",
  "Web Designer",
  "Product Designer",
  "Animator",
  "Sound Designer",
  "Fashion Designer",
  "Stylist",
  "Makeup Artist",
  "Set Designer",
];

export default function SearchPage() {
  return (
    <div className="min-h-screen w-full">
      <SearchWizard talentRoles={TALENT_ROLES} />
    </div>
  );
}
