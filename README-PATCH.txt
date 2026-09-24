US v1.1.11 fixes

This patch is intended to be applied on top of the current v1.1.10 project.

Important: the photo/profile, photo-of-day and plans permission errors are Firestore security-rule errors. Replacing GitHub Pages files does NOT deploy Firestore rules.

After replacing the files:
1. Open Firebase Console -> Firestore Database -> Rules for project lovs-12bc6.
2. Replace the current rules with firestore.rules from this patch.
3. Click Publish.
4. Reload the app on both iPhones.

Included fixes:
- profile photos layout/upload error handling
- photo of the day realtime/error recovery
- today/tomorrow plans realtime/error recovery
- delete shared savings goals
- room purchased items visibly render in the scene
- responsive hardening for current iPhone widths including 12 Pro Max and 15 Plus
- Firestore descendant rules for deep paths such as plans/options and goal contributions
