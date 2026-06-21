// src/components/Header/services/headerUserService.js
// Header'ın ihtiyaç duyduğu kullanıcı verisini (username, streak_days) çeken servis.
// Supabase çağrısı ve fallback mantığı component'in dışında, tek bir yerde yaşıyor.
// Böylece ViewModel "nasıl çekiyorum" ile değil sadece "veriyi kullanma" ile ilgilenir.

export async function fetchHeaderUserData(supabase, user) {
  if (!user) return null;

  const fallback = {
    username: user.email?.split("@")[0] || "Öğrenci",
    streak_days: 0,
  };

  try {
    const { data, error } = await supabase
      .from("en_users")
      .select("username, streak_days")
      .eq("id", user.id)
      .single();

    if (error || !data) {
      if (error) console.error("Header - Kullanıcı verisi hatası:", error);
      return fallback;
    }

    return {
      username: data.username || fallback.username,
      streak_days: data.streak_days || 0,
    };
  } catch (error) {
    console.error("Header - Catch hatası:", error);
    return fallback;
  }
}
