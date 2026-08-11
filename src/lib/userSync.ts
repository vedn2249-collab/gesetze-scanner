import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export async function syncUserDataToFirestore(data: {
  isPremiumUnlocked?: boolean;
  isTrafficUnlocked?: boolean;
  schriftsatzCredits?: {
    berufung: number;
    revision: number;
    wiederaufnahme: number;
    verfassungsbeschwerde: number;
  };
}) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      email: user.email,
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn("Error syncing user data to Firestore:", err);
  }
}
