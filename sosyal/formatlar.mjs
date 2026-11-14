/**
 * Sosyal medya formatları. Yeni boyut eklemek ya da yerleşimi değiştirmek için
 * burayı düzenle, sonra `npm run sosyal` çalıştır.
 *
 * Koordinatlar piksel. Maskotun boyu `height` ile verilir, genişliği oranından gelir.
 * İsim, unvan ve slogan sitedeki src/content.ts'ten okunur; İngilizcesi uret.mjs'te.
 * Üzerinde yazı olan formatlar `metin: true` ile işaretlenir, sadece onların
 * İngilizcesi basılır (gorseller/en/).
 *
 * Yardımcılar (lib/sahne.mjs):
 *   maskot({ poz, yuz, dalga, kablo, iz, stil })  yuz: open blink talk shout happy wink dead code
 *   kafa({ yuz, stil })                            sadece monitör kafa
 *   fidye(metin, tohum, boyut)                      fidye mektubu harfleri; tohum değişince harfler değişir
 *   patlama(uc, stil)                               yıldız patlama, renk --bc ile
 *   yer(x, y, ic)                                   mutlak konumlu kutu
 */
import { POZ } from './lib/sahne.mjs';

export function formatlar(k, me) {
  const { maskot, kafa, fidye, patlama, yer, sayfa } = k;
  const [ad, soyad] = me.name.toLocaleUpperCase('tr').split(' ');
  const unvan = me.role;
  const [s1, s2, s3] = me.manifesto;
  const slogan = me.manifesto.join(' ');

  /** Profil resmi: sadece kafa, arkada patlama. Daire içine kırpılınca da güvenli. */
  const kafaProfil = (ek, yuz, aci) => ({
    ad: `profil-kafa${ek}-1080`,
    w: 1080,
    h: 1080,
    html: sayfa(1080, 1080, {
      nokta: 14,
      ic: `${patlama(16, `left:90px;top:90px;width:900px;height:900px;rotate:${aci * 0.5}deg`)}
        <div style="position:absolute;left:180px;top:180px;width:720px;height:720px;border-radius:50%;background:#000"></div>
        ${kafa({ yuz, stil: `left:205px;top:150px;width:670px;height:826px;rotate:${aci}deg;filter:drop-shadow(-22px 14px 0 #fff) drop-shadow(-14px 8px 0 var(--red))` })}`,
    }),
  });

  return [
    kafaProfil('', 'happy', 0),
    kafaProfil('-bagir', 'shout', -8),
    kafaProfil('-bayildi', 'dead', 14),
    kafaProfil('-goz-kirp', 'wink', 6),
    kafaProfil('-grunge', 'grunge', -5),
    {
      // Profil resmi alternatifi: el sallayan büst.
      ad: 'profil-selam-1080',
      w: 1080,
      h: 1080,
      html: sayfa(1080, 1080, {
        nokta: 14,
        zemin: `<div class="slab" style="left:-80px;top:700px;width:1300px;height:260px;rotate:-9deg"></div>`,
        ic: `${patlama(14, 'left:600px;top:150px;width:360px;height:360px;--bc:#fff')}
          ${maskot({ poz: POZ.selam, yuz: 'happy', kablo: false, stil: 'left:-105px;top:60px;height:1500px' })}`,
      }),
    },
    {
      // Profil: kırmızı zemin, ekranda kod akıyor.
      ad: 'profil-kod-1080',
      w: 1080,
      h: 1080,
      html: sayfa(1080, 1080, {
        zemin: `<div style="position:absolute;inset:0;background:var(--red)"></div>
          <div class="dots" style="--dot:16px;opacity:.55"></div>`,
        ic: `${patlama(18, 'left:110px;top:110px;width:860px;height:860px;--bc:#000;rotate:8deg')}
          ${kafa({ yuz: 'code', stil: 'left:220px;top:150px;width:640px;height:790px;rotate:-7deg;filter:drop-shadow(-20px 14px 0 #fff) drop-shadow(-12px 8px 0 #000)' })}`,
      }),
    },
    {
      // Profil: boydan, gitarı çalıp bağırıyor. Ayaklar daire içinde kalır.
      ad: 'profil-sahne-1080',
      w: 1080,
      h: 1080,
      html: sayfa(1080, 1080, {
        nokta: 14,
        zemin: `<div style="position:absolute;left:150px;top:150px;width:780px;height:780px;border-radius:50%;background:var(--red)"></div>
          <div class="tape" style="left:-60px;top:860px;width:1200px;--th:44px;rotate:-6deg"></div>`,
        ic: `${patlama(14, 'left:700px;top:120px;width:220px;height:220px;--bc:#fff')}
          ${maskot({ yuz: 'shout', kablo: false, dalga: { boy: 0.3, faz: 1.6, aci: 14 }, stil: 'left:175px;top:100px;height:880px' })}`,
      }),
    },
    {
      // Profil: yakın plan, göz kırpıyor; gözlük kadrajı doldurur.
      ad: 'profil-yakin-1080',
      w: 1080,
      h: 1080,
      html: sayfa(1080, 1080, {
        nokta: 14,
        zemin: `<div class="slab" style="left:-100px;top:620px;width:1300px;height:300px;rotate:-12deg"></div>`,
        ic: kafa({ yuz: 'wink', stil: 'left:-60px;top:-190px;width:1200px;height:1480px;rotate:5deg;filter:drop-shadow(-26px 16px 0 var(--red))' }),
      }),
    },
    {
      // LinkedIn kapak. Profil fotoğrafı sol altı kapatır: yazı 470px'ten başlar.
      ad: 'linkedin-kapak-1584x396',
      metin: true,
      w: 1584,
      h: 396,
      html: sayfa(1584, 396, {
        vinyet: '62% 40%',
        zemin: `<div class="slab" style="left:1170px;top:-60px;width:560px;height:540px;rotate:9deg"></div>
          <div class="tape" style="left:-40px;top:352px;width:1700px;--th:30px;rotate:-1deg"></div>`,
        ic: `${patlama(14, 'left:1420px;top:14px;width:130px;height:130px;--bc:#fff')}
          ${maskot({ yuz: 'shout', kablo: false, dalga: { boy: 0.42, faz: 1.2, aci: 4 }, stil: 'left:1150px;top:0px;height:540px' })}
          ${yer(470, 26, fidye(ad, 3, 78))}
          ${yer(520, 118, fidye(soyad, 4, 78))}
          <div class="tag" style="left:478px;top:226px;--tf:20px;rotate:-1.5deg">${unvan}</div>
          <div class="poster" style="position:absolute;left:482px;top:280px;font-size:44px">${s1} <span class="stroke" style="--sw:2px">${s2}</span> <span style="color:var(--red)">${s3}</span></div>`,
      }),
    },
    {
      // X (Twitter) kapak. Avatar sol altta: yazı 330px'ten başlar.
      ad: 'x-kapak-1500x500',
      metin: true,
      w: 1500,
      h: 500,
      html: sayfa(1500, 500, {
        vinyet: '62% 40%',
        zemin: `<div class="slab" style="left:1040px;top:-60px;width:620px;height:640px;rotate:10deg"></div>
          <div class="tape" style="left:-40px;top:458px;width:1600px;--th:28px;rotate:-.8deg"></div>`,
        ic: `${patlama(14, 'left:1330px;top:16px;width:150px;height:150px;--bc:#fff')}
          ${maskot({ yuz: 'shout', kablo: false, dalga: { boy: 0.42, faz: 1.2, aci: 4 }, stil: 'left:1010px;top:-14px;height:640px' })}
          ${yer(330, 40, fidye(ad, 5, 92))}
          ${yer(356, 150, fidye(soyad, 6, 92))}
          <div class="tag" style="left:338px;top:276px;--tf:22px;rotate:-1.5deg">${unvan}</div>
          <div class="poster" style="position:absolute;left:338px;top:340px;font-size:46px">${s1} <span class="stroke" style="--sw:2px">${s2}</span> <span style="color:var(--red)">${s3}</span></div>`,
      }),
    },
    {
      // Instagram gönderi (4:5). Profil ızgarasında ortadaki kare görünür.
      ad: 'instagram-gonderi-1080x1350',
      metin: true,
      w: 1080,
      h: 1350,
      html: sayfa(1080, 1350, {
        nokta: 13,
        vinyet: '50% 45%',
        zemin: `<div class="slab" style="left:-80px;top:960px;width:1300px;height:300px;rotate:-7deg"></div>`,
        ic: `${patlama(16, 'left:600px;top:330px;width:520px;height:520px')}
          ${maskot({ yuz: 'shout', dalga: { boy: 0.5, faz: 0.9, aci: 12 }, stil: 'left:330px;top:410px;height:830px' })}
          ${yer(60, 60, fidye(ad, 11, 140))}
          ${yer(130, 230, fidye(soyad, 12, 140))}
          <div class="tag tag--white" style="left:64px;top:1250px;--tf:32px;rotate:-2deg">${slogan}</div>`,
      }),
    },
    {
      // Instagram hikaye. Üst ve alt ~250px'te arayüz var, önemli şey ortada.
      ad: 'instagram-hikaye-1080x1920',
      metin: true,
      w: 1080,
      h: 1920,
      html: sayfa(1080, 1920, {
        nokta: 14,
        zemin: `<div class="tape" style="left:-60px;top:262px;width:1250px;--th:40px;rotate:-3deg"></div>
          <div class="slab" style="left:-100px;top:1330px;width:1300px;height:360px;rotate:-8deg"></div>`,
        ic: `${patlama(18, 'left:500px;top:720px;width:620px;height:620px')}
          ${maskot({ yuz: 'shout', dalga: { boy: 0.5, faz: 2.4, aci: 12 }, stil: 'left:300px;top:800px;height:860px' })}
          ${yer(70, 360, fidye(ad, 21, 150))}
          ${yer(150, 545, fidye(soyad, 22, 150))}
          <div class="tag" style="left:80px;top:740px;--tf:30px;rotate:-1.5deg">${unvan}</div>
          <div class="poster" style="position:absolute;left:70px;top:1380px;font-size:92px;line-height:1.14;color:#000;rotate:-8deg">${s1}<br>${s2}<br>${s3}</div>`,
      }),
    },
  ];
}
