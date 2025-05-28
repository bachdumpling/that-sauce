import axios, { AxiosError } from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const API_URL = process.env.API_URL || "http://localhost:8000/api";
const TEST_EMAIL = process.env.TEST_EMAIL || "bach@ohos.nyc";

/**
 * Test the onboarding flow
 */
async function testOnboardingFlow() {
  try {
    console.log("Starting onboarding flow test...");

    // Step 1: Get a test auth token
    console.log("Authenticating...");
    // NOTE: In a real testing scenario, you would use the actual authentication endpoint
    // For now, we'll assume a token is provided via environment variable
    const token = process.env.TEST_AUTH_TOKEN;

    if (!token) {
      console.error(
        "No test auth token provided. Set TEST_AUTH_TOKEN in .env file"
      );
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // Step 2: Check initial onboarding status
    console.log("Checking initial onboarding status...");
    try {
      const statusResponse = await axios.get(`${API_URL}/onboarding/status`, {
        headers,
      });
      console.log(
        "Initial status:",
        JSON.stringify(statusResponse.data, null, 2)
      );
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error(
        "Error getting initial status:",
        axiosError.response?.data || axiosError.message
      );
      // Continue with the test even if this fails
    }

    // Step 3: Set user role as creator
    console.log("Setting user role to creator...");
    try {
      const roleResponse = await axios.put(
        `${API_URL}/onboarding/role`,
        { role: "creator" },
        { headers }
      );
      console.log("Role set:", JSON.stringify(roleResponse.data, null, 2));
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error(
        "Error setting role:",
        axiosError.response?.data || axiosError.message
      );
      // We should still continue with the test
    }

    // Step 4: Upload a profile image
    console.log("Uploading profile image...");
    let avatarUrl = "https://example.com/test-avatar.jpg"; // Default fallback URL

    // For testing, we need a sample image file
    const testImagePath = path.resolve(
      __dirname,
      "./test-assets/test-avatar.jpg"
    );

    if (!fs.existsSync(testImagePath)) {
      console.error(`Test image not found at ${testImagePath}`);
      console.log("Creating a test directory and test file notification...");

      // Create test directory if it doesn't exist
      const testDir = path.resolve(__dirname, "./test-assets");
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }

      // Create a text file with instructions
      fs.writeFileSync(
        path.resolve(testDir, "README.txt"),
        "Place a test image named test-avatar.jpg in this directory for testing the profile image upload."
      );

      console.log("Skipping image upload test due to missing test image.");
    } else {
      // Upload the image
      try {
        const formData = new FormData();
        formData.append("file", fs.createReadStream(testImagePath));

        const uploadHeaders = {
          ...headers,
          ...formData.getHeaders(),
        };

        const imageResponse = await axios.post(
          `${API_URL}/onboarding/profile-image`,
          formData,
          { headers: uploadHeaders }
        );

        console.log(
          "Image uploaded:",
          JSON.stringify(imageResponse.data, null, 2)
        );

        // Get the avatar URL from the response for use in later steps
        if (imageResponse.data?.data?.avatar_url) {
          avatarUrl = imageResponse.data.data.avatar_url;
        }
      } catch (error: unknown) {
        const axiosError = error as AxiosError;
        console.error(
          "Error uploading image:",
          axiosError.response?.data || axiosError.message
        );
        // Continue with the test even if image upload fails
      }
    }

    // Step 5: Set profile information
    console.log("Setting profile information...");
    try {
      const profileResponse = await axios.put(
        `${API_URL}/onboarding/profile`,
        {
          first_name: "Test",
          last_name: "User",
          bio: "A test user for the onboarding flow",
          primary_role: ["Designer", "Developer"],
          location: "Test City, Test Country",
          avatar_url: avatarUrl, // Use the uploaded image URL or fallback
        },
        { headers }
      );
      console.log(
        "Profile set:",
        JSON.stringify(profileResponse.data, null, 2)
      );
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error(
        "Error setting profile:",
        axiosError.response?.data || axiosError.message
      );
      // This is a critical step, but we'll try to continue
    }

    // Step 6: Set social links
    console.log("Setting social links...");
    try {
      const socialLinksResponse = await axios.put(
        `${API_URL}/onboarding/social-links`,
        {
          social_links: {
            website: "example.com",
            instagram: "testuser",
            linkedin: "in/testuser",
          },
        },
        { headers }
      );
      console.log(
        "Social links set:",
        JSON.stringify(socialLinksResponse.data, null, 2)
      );
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error(
        "Error setting social links:",
        axiosError.response?.data || axiosError.message
      );
      // This is the final step, but we'll still check the status
    }

    // Step 7: Verify onboarding completion
    console.log("Verifying onboarding completion...");
    try {
      const finalStatusResponse = await axios.get(
        `${API_URL}/onboarding/status`,
        { headers }
      );
      console.log(
        "Final status:",
        JSON.stringify(finalStatusResponse.data, null, 2)
      );

      if (finalStatusResponse.data?.data?.onboarding_completed) {
        console.log("✅ Onboarding successfully completed!");
      } else {
        console.log(
          "⚠️ Onboarding not marked as completed. Check the logs above for errors."
        );
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error(
        "Error getting final status:",
        axiosError.response?.data || axiosError.message
      );
    }

    console.log("Onboarding flow test completed!");
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    console.error(
      "Unexpected error in test:",
      axiosError.response?.data || axiosError.message
    );
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testOnboardingFlow();
}

export { testOnboardingFlow };
 