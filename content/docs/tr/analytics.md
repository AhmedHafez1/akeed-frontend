---
title: Analiz
description: Temel kapıda ödeme onay metriklerinizi anlayın ve bunları sevkiyat kalitesini artırmak ve kayıpları azaltmak için kullanın.
order: 10
slug: analytics
---

## Genel Bakış

Akeed’deki analizler pratik bir soruyu yanıtlamanıza yardımcı olur:

**Doğru kapıda ödeme siparişlerini doğru zamanda mı gönderiyoruz?**

Onay kalitesini takip etmek, darboğazları tespit etmek ve operasyonel kararlarınızı haftadan haftaya iyileştirmek için panel metriklerinizi kullanın.

## En Önemli Metrikler

Her sayının operasyonel değeri aynı değildir. Önce şunlara odaklanın:

| Metrik | Neden önemli |
| --- | --- |
| Onay oranı | Gönderilen onayların ne kadarının gerçek, kargoya hazır siparişe dönüştüğünü gösterir. |
| Yanıt oranı | Müşterilerin mesajlarınızla etkileşime girip girmediğini gösterir. |
| Yanıt yok hacmi | Olası zamanlama veya mesaj uyumu sorunlarını gösterir. |
| Başarısız gönderimler | Teslimat veya yapılandırma sorunlarını öne çıkarır. |
| Kullanım ilerlemesi | Plan sınırınıza beklenmedik şekilde ulaşmanızı ya da kredinizin bitmesini önler. |

## Metrik Tanımları (Satıcı Görünümü)

### Onay Oranı

Mesaj gönderildikten sonra kaç müşterinin onayladığı.

Yüksek onay oranı genellikle şunlara işaret eder:

- müşterinin satın alma niyetinin güçlü olması,
- şablon metninin açık olması,
- zamanlama ayarlarının sağlıklı olması.

### Yanıt Oranı

Gönderimden sonra kaç müşterinin yanıt verdiği (onay veya iptal).

Yanıt oranı düşükse büyük politika değişiklikleri yapmadan önce şablonun anlaşılırlığını ve mesaj zamanlamasını gözden geçirin.

### Yanıt Bekleniyor

Gönderilmiş ancak henüz müşteriden kesin bir yanıt almamış siparişler.

Yoğun trafik dönemlerinde geçici bir artış normaldir, ancak sürekli artış hatırlatma veya zamanlama stratejinizin büyük olasılıkla ayarlanması gerektiği anlamına gelir.

### Başarısız Gönderimler

Gönderilemeyen mesajlar.

Bunu her gün takip edin. Küçük bir başarısızlık artışı bile etkili onay hacminizi sessizce düşürebilir.

### Kullanım (Kullanılan / Sınır)

Shopify’da bu, planınıza dahil onaylara göre ilerlemeyi gösterir. Bağımsız bir hesapta bunun yerine kredi bakiyenizi takip edin.

Bunu yalnızca bir faturalandırma bilgisi olarak değil, operasyonel bir sinyal olarak kullanın.

> [!WARNING]
> Kullanım sınırınıza ulaşırsa ya da krediniz biterse, yenileme, plan yükseltme veya kredi satın alma işlemine kadar yeni onaylar durabilir.

## Eğilimler Nasıl Okunur (Haftalık)

Basit bir haftalık değerlendirme yapın:

1. Onay oranını ve yanıt oranını bu hafta ile geçen hafta arasında karşılaştırın.
2. Yanıt yok hacminin ters yönde hareket edip etmediğini kontrol edin.
3. Başarısız gönderimleri ve kullanım baskısını kontrol edin.
4. Kontrollü tek bir değişiklik yapın (şablon, zamanlama veya hatırlatma).
5. Etkisini bir sonraki hafta değerlendirin.

Yalnızca tek bir güne bakarak iyileştirme yapmayın.

## Önerilen Uyarı Eşikleri

| Sinyal | Önerilen eşik | İşlem |
| --- | --- | --- |
| Yanıt oranında düşüş | Önceki döneme göre %10’dan fazla düşüş | Şablonun üslubunu ve gönderim zamanlamasını gözden geçirin. |
| Yanıt yok artışı | Haftadan haftaya %15’ten fazla artış | Hatırlatma ve yanıt yok işaretleme sürelerini açın veya yeniden ayarlayın. |
| Başarısız gönderimler | Ani artış | Telefon numaralarının doğruluğunu ve ayarları kontrol edin. |
| Kullanım baskısı | Planınızın %80’i ve %95’i ya da düşük kredi bakiyesi | Sınıra ulaşmadan planınızı yükseltin veya kredi satın alın. |

## Sık Yapılan Hatalar

| Hata | Daha iyi yaklaşım |
| --- | --- |
| Yalnızca toplam onay sayısına bakmak | Yalnızca ham hacmi değil, oranları da takip edin. |
| Birçok ayarı aynı anda değiştirmek | Her değerlendirme döneminde tek bir değişkeni değiştirin. |
| Hacim küçük diye başarısız gönderimleri görmezden gelmek | Başarısızlıkları erken uyarı sinyali olarak görün. |
| Verileri tutarsız tarih aralıklarıyla incelemek | Eşit dönemleri karşılaştırın (örneğin son 7 gün ile önceki 7 gün). |

## Metrik Örüntüsüne Göre Sorun Giderme

### Yanıt oranı düştü, başarısız gönderimler sabit

- Büyük olasılıkla içerik veya zamanlama sorunu.
- Farklı bir şablon çeşidini deneyin.
- Sessiz saatleri ve ilk gönderim gecikmesini yeniden kontrol edin.

### Yanıt oranı sabit, onay oranı düştü

- Müşteriler yanıt veriyor ancak daha fazla iptal ediyor.
- Teklif ile müşteri beklentisinin uyumunu ve siparişlerin kaynağındaki kaliteyi gözden geçirin.

### Yanıt yok arttı, kullanım normal

- Hatırlatma zamanlaması çok geç olabilir.
- İlk gönderim, müşterilerin aktif olduğu saatleri kaçırıyor olabilir.

### Performans güçlü, kullanım sınıra yakın

- Bu iyi bir sorun: talep sağlıklı.
- Gönderimler durmadan önce planınızı yükseltin veya kredi satın alın.

## SSS

### Önce neyi iyileştirmeliyim?

Yanıt oranı ve onay oranıyla başlayın. Bunlar en güçlü kalite sinyallerinizdir.

### Analizleri ne sıklıkla incelemeliyim?

Her gün hızlı bir kontrol, her hafta karar odaklı bir değerlendirme.

### Yüksek hacim her zaman iyi midir?

Yalnızca kalite korunuyorsa. Zayıf oranlarla gelen yüksek hacim, pahalı bir operasyonel israfı gizleyebilir.

### Analizleri inceledikten sonra sonuçları nerede iyileştiririm?

Önce otomasyon zamanlamasını ve şablon üslubunu ayarlayın.

Ayrıca bakın: [Otomasyon Kuralları](/docs/automation-rules)
