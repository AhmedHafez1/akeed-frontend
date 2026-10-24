---
title: Sipariş Onayı
description: Akeed’in kapıda ödeme siparişlerini WhatsApp üzerinden nasıl onayladığını ve günlük sevkiyat akışınızda her duruma göre nasıl hareket edeceğinizi öğrenin.
order: 7
slug: order-confirmation
---

## Genel Bakış

Akeed, kapıda ödemeli siparişleri kargoya vermeden önce onaylamanıza yardımcı olur.

Yeni ve uygun bir kapıda ödeme siparişi oluşturulduğunda Akeed müşteriye bir WhatsApp onay mesajı gönderir, yanıtı bekler ve ardından panelinizdeki sipariş durumunu günceller.

Böylece ekibiniz net bir “gönder” ya da “beklet” sinyali alır.

Siparişler Shopify’dan, elle eklediğiniz bir siparişten ya da içe aktardığınız bir dosyadan gelebilir. İlk mesajdan sonra hepsi aynı akışı izler. [Akeed’i Shopify Olmadan Kullanma](/docs/standalone-platform) ve [Toplu Sipariş İçe Aktarma](/docs/bulk-order-import) kılavuzlarına bakın.

## Neden Önemli

Kapıda ödeme operasyonları genellikle iki noktada para kaybeder:

- Müşterinin niyeti doğrulanmadan kargoya verilen siparişler.
- Müşteri yanıt vermediği için teslim edilemeyen siparişler.

Sipariş onayı her ikisini de azaltmaya yardımcı olur.

## Akış Nasıl İşler

1. Akeed siparişin kapıda ödeme onayına uygun olup olmadığını kontrol eder.
2. Akeed bir WhatsApp onay mesajı gönderir.
3. Müşteri onaylar, iptal eder ya da yanıt vermez.
4. Akeed durumu günceller ve panel görünümlerine yansıtır.
5. Hatırlatma ve yanıt yok işaretleme kuralları ayarlarınıza göre uygulanır.
6. Bağlı bir mağazada Akeed yanıtı siparişe kaydeder: Shopify’da bir etiket, EasyOrders’da bir durum, WooCommerce’de bir not ya da iptal edildi durumu.

> [!INFO]
> Akeed’in ana onay akışı kapıda ödeme siparişleri içindir.

## Durumlar ve Yapmanız Gerekenler

| Durum | Anlamı | Önerilen İşlem |
| --- | --- | --- |
| Başlatılmayı bekliyor | Bir dosyadan içe aktarıldı ve bekletiliyor. Henüz mesaj gönderilmedi. | Onayı içe aktarma ekranından başlatın ya da 24 saatlik süre geçtiyse dosyayı yeniden yükleyin. |
| Beklemede | Doğrulama oluşturuldu ancak ilk mesaj henüz gönderilmedi. | Kısa bir süre bekleyin; çok uzun süre beklemede kalırsa gecikme ayarlarını gözden geçirin. |
| Gönderildi | Mesaj başarıyla gönderildi. | Müşterinin yanıtını bekleyin. |
| Teslim edildi | WhatsApp mesajın teslim edildiğini bildiriyor. | Yanıtı izlemeye devam edin. |
| Okundu | Müşteri mesajı açtı. | İzlemeye devam edin ya da hatırlatma otomasyonuna güvenin. |
| Onaylandı | Müşteri siparişi onayladı. | Sevkiyatta öncelik verin. |
| İptal edildi | Müşteri iptal etti (ya da yanıt gelmediği için satıcı iptal etti). | Kargoya vermeyin. |
| Yanıt yok | Ayarladığınız yanıt yok işaretleme süresi içinde yanıt gelmedi. | Hızla gözden geçirin ve iptal politikanızı uygulayın. |
| WhatsApp yok | Müşterinin numarası WhatsApp’ta değil, bu yüzden mesaj ulaşamıyor. Akeed hatırlatma göndermez ve bu mesajı kullanımınıza saymaz. | Müşteriyi arayın, ardından siparişi elle onaylayın ya da iptal edin. |
| Gönderim bekliyor | Planınızın onayları veya krediniz bittiği için mesaj gönderilmedi. Ücret alınmaz. | Planınızı yükseltin ya da kredi satın alın; Akeed mesajı otomatik olarak gönderir. |
| Başarısız | Gönderim başarısız oldu ya da engellendi. | Telefon numarasının doğruluğunu, plan kullanımını veya kredi bakiyesini ve ayarları kontrol edin. |

## Satıcılar İçin Pratik Akış

### 1) Önce onaylanan siparişleri gönderin

Onaylandı durumunu en güvenli sevkiyat kuyruğunuz olarak kullanın.

### 2) Yanıt yok siparişlerini her gün gözden geçirin

Yanıt yok siparişlerinin birikmesine izin vermeyin. Standart işleyişinize göre yeniden denemeye ya da iptal etmeye karar verin.

### 3) Başarısız gönderimleri takip edin

Başarısız bir gönderim yalnızca paneldeki bir sayı değil, operasyonel bir sinyaldir.

## Sık Yapılan Hatalar

| Hata | Daha İyi Yaklaşım |
| --- | --- |
| Tüm kapıda ödeme siparişlerini durumu beklemeden kargoya vermek | “Önce onaylananlar” kuralını varsayılan yapın. |
| Yanıt yok siparişlerini günlerce görmezden gelmek | Her gün yanıt yok siparişlerini gözden geçirmeyi rutin hale getirin. |
| Yedek bir süreç olmadan otomasyonu kapatmak | Otomasyonu kapatmadan önce elle takibin sorumlusunu belirleyin. |
| “Teslim edildi” durumunu “onaylandı” saymak | Kargo kararlarını yalnızca “onaylandı” belirlemeli. |

## Sorun Giderme

### Çok fazla yanıt yok siparişi var

- İlk gönderim gecikmesini azaltın.
- Hatırlatmaları açın.
- Mesaj zamanlamasının müşterilerin aktif olduğu saatlere uyduğunu kontrol edin.

### Siparişler çok uzun süre beklemede kalıyor

- Gönderim gecikmesi ayarlarını gözden geçirin.
- Otomatik doğrulamanın açık olduğunu kontrol edin.
- Siparişlerin gerçekten kapıda ödeme onayına uygun olduğunu kontrol edin.

### Başarısız onaylar artıyor

- Telefon numaralarının doğruluğunu ve ülke kodu biçimini kontrol edin.
- Mevcut plan kullanımını veya kredi bakiyesini kontrol edin.
- Geçerli olduğunu bildiğiniz bir numaraya test onayı gönderin.

## SSS

### Akeed onaylanmayan tüm siparişleri otomatik olarak iptal eder mi?

Yalnızca ayarlarda **Yanıtsız siparişleri otomatik iptal et** seçeneğini açarsanız ve yalnızca her mesaj teslim edildikten sonra yanıtsız kalan, müşterinin onaylamadığı ya da iptal etmediği siparişler için. Aksi hâlde yanıtsız siparişler sizi bekler. Bkz. [Otomasyon Kuralları](/docs/automation-rules).

### Müşteriler yanıt yok durumundan sonra da yanıt verebilir mi?

Evet, istedikleri zaman. Akeed, onay ya da iptal olarak okuyamadığı mesajları yok sayar. Akeed siparişi zaten iptal ettiyse ve müşteri sonra onaylarsa sipariş **İptalden sonra onayladı** olarak görünür ve **İşlem bekleyenler** bölümüne taşınır. Müşteriyle **WhatsApp’tan yazın** ile ya da telefonla iletişime geçin. Sipariş, siz mağazanızda değiştirene kadar iptal edilmiş olarak kalır.

### “Teslim edildi” kargoya vermek için yeterli mi?

Hayır. Teslim edildi yalnızca mesajın müşteriye ulaştığı anlamına gelir. Kargoya güvenle vermek için **Onaylandı** durumunu esas alın.

### Müşterinin numarası WhatsApp’ta değilse ne olur?

WhatsApp, Akeed’e mesajın teslim edilemeyeceğini bildirir ve sipariş **WhatsApp yok** durumuna geçer. Siparişi **WhatsApp yok** sekmesinde ve **İşlem gerekiyor** bölümünde bulursunuz. Akeed hatırlatmayı iptal eder, mesajı kullanımınıza saymaz ve Shopify’da siparişe `Akeed: No WhatsApp` etiketini ekler. Müşteriyi arayın, ardından siparişi elle onaylayın ya da iptal edin.

### Planımın onayları veya kredim bittiğinde ne olur?

Yeni siparişler yine alınır, ancak mesajları **Gönderim bekliyor** durumunda bekler ve panodaki kırmızı bir uyarı kaç siparişin beklediğini ve ne yapabileceğinizi gösterir. Bunlar için ücret alınmaz. Planınızı yükselttiğinizde, kredi satın aldığınızda ya da plan kotanız yenilendiğinde Akeed bunları en eskisinden başlayarak, gönderim gecikmesine ve sessiz saatlere uyarak otomatik olarak gönderir. 24 saatten uzun bekleyen bir sipariş kendiliğinden gönderilmez: onaylayabileceğiniz, iptal edebileceğiniz ya da yeniden deneyebileceğiniz **İşlem bekleyen** bölümüne taşınır.

Ücretli bir Shopify planında uyarı ayrıca planınızın adını taşıyan bir yenileme düğmesi sunar, örneğin **Basic planını şimdi yenile**. Mevcut planınızı Shopify’da yeniden onaylarsınız ve tam hakla 30 günlük yeni bir dönem hemen başlar; bekleyen siparişler gönderilir. Eski dönemden kalan mesajlar devretmez. Aynı düğme **Ayarlar → Plan** bölümünde mevcut planınızda da bulunur.

### Zamanlamayı ve hatırlatmaları nereden ayarlarım?

Ayarlar’daki otomasyon bölümüne gidin.

Ayrıca bakın: [Otomasyon Kuralları](/docs/automation-rules)
