// utils/coinUtils.js - Yeni dosya

// Coin sesini çal
export const playCoinSound = () => {
    try {
        const audio = new Audio('/sounds/coin.mp3');
        audio.volume = 0.5;
        audio.play().catch(err => console.log('Ses çalınamadı:', err));
    } catch (error) {
        console.log('Ses hatası:', error);
    }
};

// Coin animasyonunu göster
export const showCoinAnimation = () => {
    // Floating coin animasyonu için event gönder
    window.dispatchEvent(new CustomEvent('showCoinAnimation'));
};