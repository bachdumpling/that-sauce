import Landing from "@/components/Landing/Landing";
import { client } from "@/sanity/lib/client";
import { LANDING_PAGE_QUERY } from "@/lib/sanity/queries";
import { LandingPageData } from "@/types/sanity";

export default async function Home() {
  const landingPageData: LandingPageData =
    await client.fetch(LANDING_PAGE_QUERY);

  return (
    <>
      <Landing landingPageData={landingPageData} />
    </>
  );
}
