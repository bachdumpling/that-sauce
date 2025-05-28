import { Router } from "express";
import { OnboardingController } from "../controllers/onboardingController";
import { extractUser } from "../middleware/extractUser";
import { cacheClearMiddleware } from "../lib/cache";
import { uploadMiddleware } from "../middleware/uploadMiddleware";

const router = Router();
const onboardingController = new OnboardingController();

// Apply authentication middleware to all onboarding routes
router.use(extractUser);

/**
 * Get current onboarding status
 * GET /api/onboarding/status
 */
router.get(
  "/status",
  onboardingController.getStatus.bind(onboardingController)
);

/**
 * Set user role (creator or employer)
 * PUT /api/onboarding/role
 */
router.put(
  "/role",
  onboardingController.setUserRole.bind(onboardingController)
);

/**
 * Set organization information (for employers)
 * PUT /api/onboarding/organization
 */
router.put(
  "/organization",
  cacheClearMiddleware(["organization_"]),
  onboardingController.setOrganization.bind(onboardingController)
);

/**
 * Upload profile image
 * POST /api/onboarding/profile-image
 */
router.post(
  "/profile-image",
  uploadMiddleware,
  cacheClearMiddleware([
    "creator_username_",
    "creator_project_",
    "creator_details_",
    "search_creators_",
  ]),
  onboardingController.uploadProfileImage.bind(onboardingController)
);

/**
 * Set user profile information
 * PUT /api/onboarding/profile
 */
router.put(
  "/profile",
  cacheClearMiddleware([
    "creator_username_",
    "creator_project_",
    "creator_details_",
    "search_creators_",
  ]),
  onboardingController.setProfile.bind(onboardingController)
);

/**
 * Set social links
 * PUT /api/onboarding/social-links
 */
router.put(
  "/social-links",
  cacheClearMiddleware([
    "creator_username_",
    "creator_project_",
    "creator_details_",
    "search_creators_",
  ]),
  onboardingController.setSocialLinks.bind(onboardingController)
);

/**
 * Set username (final step of onboarding)
 * PUT /api/onboarding/username
 */
router.put(
  "/username",
  cacheClearMiddleware([
    "creator_username_",
    "creator_project_",
    "creator_details_",
    "search_creators_",
  ]),
  onboardingController.setUsername.bind(onboardingController)
);

export default router;
