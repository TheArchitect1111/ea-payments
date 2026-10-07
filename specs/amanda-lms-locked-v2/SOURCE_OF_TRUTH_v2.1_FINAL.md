LMS Build - LOCKED v2.1 - SOURCE OF
TRUTH
Date: Oct 2, 2026 - AMANDA APPROVED -
Final values from WhatsApp
This is the ONLY document ChatGPT/Codex
is allowed to build from.
1. SELL STATUS - READY TO SELL
   Nervous System Reset = READY TO SELL (1a-a)
   Body Sculpt = READY TO SELL (1b-a)
   Non-Surgical BBL: Glute Build & Sculpt Certification = READY TO SELL (1c-b,
renamed per #5)
   Wood Therapy = READY TO SELL (1d-b)


2. PRACTITIONER KIT LOGIC - 2b - AMANDA
APPROVED FREE SHIPPING
   Practitioner kit IS included in tuition.
   SHIPPING IS FREE FOR NOW per Amanda 9:01 AM Oct 2: "Shipping fee we can
leave free for now"
   Implementation:
        At checkout, present radio selection:
   [ ] Free Pickup (Class / Shop)
   [ ] Ship to me - FREE
        Both options charge $0 shipping
        If Ship selected: still capture shipping address for fulfillment, but amount =
   $0
      DO NOT implement paid shipping rates until Amanda approves otherwise
      Approved contract: keep pickup and ship-to-me free; capture the ship-to address and do not calculate or charge paid rates without new approval from Amanda.


3. SUPPORT / MENTORSHIP - 3e + AMANDA
APPROVED
   Support Channels: Portal communication + email + scheduled mentorship calls
   Scheduling System: Jane App + Gmail account per Amanda 9:01 AM
   Implementation:
      Portal Support tab must link to Jane App booking
      Email via Gmail integration
      CRITICAL DO NOT: Do NOT advertise unlimited phone/text access anywhere
   (sales page, checkout, portal, emails).


4. 90 DAY CLOCK - 4b
   The 90 days begin on the class/training date.
   MANDATORY EXACT WORDING TO USE EVERYWHERE:
"Includes 90 days of clinical integration support and business mentorship."
   Replace all other variants (e.g., "lifetime support", "ongoing mentorship", "90
days mentorship") with exact wording above.


5. COURSE NAME FIX - 5d
   Official Name: Non-Surgical BBL: Glute Build & Sculpt Certification
   Delete all instances of old BBL names. Use only this.


6. COURSE ARCHITECTURE - OWNER UPDATE OCT 7, 2026
   Non-Surgical Tummy Sculpt & Tighten is RETIRED and must be deleted from the
public page, course catalog, waitlist, portal menus and future builds.
   Current course name: Clinical Fat Loss Injectables for Face & Body
Contouring
   This is the only current fat-loss/body-contouring waitlist course. Do not restore
the retired Tummy Sculpt course without a new Amanda approval.


7. CERTIFICATION REQUIREMENTS
   7a: b + c + d = Case study + quiz + practical demonstration/evidence. Evidence
can include photos or video where appropriate and with proper client consent.
   7b: a = I approve final certification in the portal.
         Build admin approval button/queue for final sign-off.


8. ENTITLEMENT LOGIC - 8a
   Online learning unlocks IMMEDIATELY AFTER PURCHASE for any course marked
READY.
   Courses that are NOT ready remain waitlist only and should NOT generate an
entitlement, portal access, or checkout.
   Logic:
IF course.status == READY -> Sales Page -> Checkout -> Immediate Entitlement ->
Unlock Online Learning
ELSE -> Sales Page -> Join Waitlist -> No Checkout -> No Entitlement


GLOBAL COMPLIANCE RULE - CPD
   DO NOT USE "CPD Accredited" anywhere unless we have actually received
accreditation from the applicable accrediting organization.
   The LMS can track CPD hours and place approved hours on certificates, but the
platform itself does not make a course accredited.
   Allowed wording: "CPD Hours Tracked: X hours" / "Certificate lists CPD hours
completed"
   Not allowed: "CPD Accredited", "CPD Certified Course", any CPD accreditation
logos.
MENU WIRING - PURCHASE/READINESS AWARE
   Function getCourseMenuRoute(course, user) must be implemented
   Courses/Progress/Certification menu must check purchase + readiness
   All "Portal destination established" placeholders must be replaced with actual
functions - 17 remaining per audit


ROUTING TABLE

                                                  Checkout
  Course Name                         Status                        Entitlement
                                                  Allowed

  Nervous System Reset                READY       YES               Immediate
                                                                    Unlock

  Body Sculpt                         READY       YES               Immediate
                                                                    Unlock

  Non-Surgical BBL: Glute Build &     READY       YES               Immediate
  Sculpt Certification                                              Unlock

  Wood Therapy                        READY       YES               Immediate
                                                                    Unlock

  Clinical Fat Loss Injectables for   WAITLIST    NO                No entitlement
  Face & Body Contouring
