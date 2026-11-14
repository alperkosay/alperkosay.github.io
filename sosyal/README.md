# Sosyal medya + karakter şablonu

Maskot sitedeki React bileşeninden ([Mascot.tsx](../src/components/Mascot.tsx)) çizilir. İsim, unvan ve slogan [content.ts](../src/content.ts)'ten okunur. Sitede bir şey değişirse burada da değişir.

```
npm run sosyal              # hepsini yeniden üret
npm run sosyal -- gorsel    # sadece sosyal medya görselleri
npm run sosyal -- karakter  # sadece karakter kiti
```

Bilgisayarda Chrome ya da Edge olması yeter. Başka bir yerdeyse yolunu `TARAYICI` ortam değişkeniyle ver.

## Neyi nerede değiştirirsin

| Ne | Nerede |
|---|---|
| Renkler (ceket, saç, ekran, zemin, dalga) | `uret.mjs` → `AYAR.renk` |
| İsim, unvan, slogan | `src/content.ts` → `me` |
| İngilizce unvan ve slogan | `uret.mjs` → `INGILIZCE` |
| Yerleşim, yeni format, yüz ifadesi | `formatlar.mjs` |

## gorseller/

| Dosya | Nerede |
|---|---|
| `profil-kafa-1080.png` | Profil resmi (her platform), daire kırpmaya uygun |
| `profil-kafa-bagir/-bayildi/-goz-kirp/-grunge-1080.png` | Aynı kafa, başka duygular |
| `profil-selam-1080.png` | Profil resmi alternatifi, el sallıyor |
| `profil-kod-1080.png` | Profil resmi alternatifi, kırmızı zemin, ekranda kod |
| `profil-sahne-1080.png` | Profil resmi alternatifi, boydan, gitar çalıyor |
| `profil-yakin-1080.png` | Profil resmi alternatifi, yakın plan, göz kırpıyor |
| `linkedin-kapak-1584x396.png` | LinkedIn kapak. Sol alt profil fotoğrafına bırakıldı |
| `x-kapak-1500x500.png` | X kapak. Sol alt avatara bırakıldı |
| `instagram-gonderi-1080x1350.png` | Instagram gönderi (4:5) |
| `instagram-hikaye-1080x1920.png` | Instagram hikaye. Üst ve alt 250px'te önemli bir şey yok |

Üzerinde yazı olanların (kapaklar, gönderi, hikaye) İngilizcesi `gorseller/en/` içinde.

## karakter/ (motion için)

- `maskot.svg` / `maskot.png`: Bütün karakter, katmanlı. PNG 2x (1040×1240) ve şeffaf.
- `maskot-kafa.svg` / `maskot-kafa.png`: Sadece kafa.
- `parcalar/`: Her katman ayrı bir SVG ve PNG. **Hepsi aynı tuvalde (520×620, PNG'de 1040×1240).** Üst üste koyunca hizalanırlar, kaydırmana gerek yok.
- `pivotlar.json`: Her katmanın dönme noktası, ebeveyni ve sitedeki kare hızı.

SVG'lerde CSS yok, renkler öznitelik olarak gömülü. Illustrator, Figma ve tarayıcı doğrudan açar. After Effects'e Illustrator'dan "katmanlarıyla" alabilirsin ya da PNG'leri kullanabilirsin.

### Katman sırası (arkadan öne)

```
01 bacak-sol      05 yelek       09 sac   (ebeveyn: kafa)
02 bacak-sag      06 kol-sol     10 kafa
03 kablo          07 gitar       11 yuz-* (ebeveyn: kafa, aynı anda biri açık)
04 govde          08 kol-sag     12 gozluk (ebeveyn: kafa)
                  08 kol-sag-selam (kol-sag'ın alternatifi)
```

Yüzler: `acik`, `kirp`, `konus`, `bagir`, `mutlu`, `goz-kirp`, `bayildi`, `grunge` (çarpı göz, gülüyor, dil dışarıda), `kod`. Konuşma için `acik` ile `konus` arasında 3 karede bir geçiş yap. Göz kırpma için 3 kare `kirp` göster.

### Sitedeki hareketin hissi

- **Kesik kesik hareket:** Hiçbir şey yumuşak akmaz. 24 kare/sn'de her parça kendi aralığında poz tutar (`kare.her`): gövde 3 karede bir, pena kolu 2, gitar 4, saç 4.
- **Parçalar birbirini geç yakalar:** Kafa 1 kare, yelek 2 kare geriden gelir (`kare.gecikme`). Bu yüzden parçalar bir an ayrılıp yerine "pop" eder. After Effects'te Posterize Time ve katman başına birkaç kare kaydırma bu hissi verir.
- **El çizimi titreme:** Sitede figürün üstünde bir titreşim filtresi var (`feTurbulence` + `feDisplacementMap`, ölçek 6). After Effects'te Turbulent Displace (Evolution her 3 karede bir değişsin) aynı işi görür.
- **İz:** Figürün düz kırmızı ve beyaz kopyaları 1 ve 2 poz geriden, hafif kayık gelir.
