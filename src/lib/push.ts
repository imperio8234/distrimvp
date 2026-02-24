// Expo Push Notifications via API pública (no requiere SDK del servidor)
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (!pushToken) return;

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify({
        to: pushToken,
        title,
        body,
        data: data ?? {},
        sound: "default",
        priority: "high",
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[Push] Error enviando notificación:", text);
    }
  } catch (err) {
    console.error("[Push] Error de red al enviar notificación:", err);
  }
}
