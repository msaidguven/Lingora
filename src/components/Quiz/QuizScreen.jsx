export default function QuizScreen() {
  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#0f0f1a", 
      color: "#e2e8f0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Quiz</h1>
      <p style={{ fontSize: 14, color: "#64748b", textAlign: "center", maxWidth: 400 }}>
        Bu sayfa şu anda geliştirme aşamasında.
        <br />
        Yakında burada özel quiz'ler olacak!
      </p>
      <div style={{ 
        marginTop: 20,
        background: "#1a1a2e",
        padding: "12px 24px",
        borderRadius: 12,
        border: "1px solid #1e293b"
      }}>
        <span style={{ fontSize: 12, color: "#64748b" }}>🚧 Yapım Aşaması</span>
      </div>
    </div>
  );
}