---
title: Sorun Giderme
description: Sık karşılaşılan kapıda ödeme onay sorunlarını net kontroller ve sonraki adımlarla hızla çözün.
order: 11
slug: troubleshooting
---

## Genel Bakış

Bu sayfa, Akeed’de en sık karşılaşılan operasyonel sorunları hızla teşhis edip çözmenize yardımcı olur.

Şu durumlarda kullanın:

- siparişler onaylanmıyorsa,
- mesajlar gecikiyor ya da gönderilmiyorsa,
- çok fazla sipariş yanıt yok durumuna geçiyorsa,
- plan kullanımı veya boş bir kredi bakiyesi yeni gönderimleri engelliyorsa,
- bir dosya içe aktarma işlemi beklendiği gibi çalışmıyorsa.

## Hızlı Ön Kontrol Listesi

Ayrıntılı sorun gidermeye geçmeden önce şunları kontrol edin:

1. Otomatik onay açık.
2. Sipariş kapıda ödeme onayına uygun.
3. Plan kullanımı sınıra ulaşmamış ya da kredi bakiyeniz (bağımsız hesaplar) boş değil.
4. Sessiz saatler gönderimleri geciktirmiyor.
5. Telefon numarası biçimi ülke kodunu içeriyor.

Bu beş kontrol çoğu sorunu çözer.

## Sorun: Sipariş onaylanmadı

### Neleri kontrol etmeli

- Siparişin ödeme yöntemi kapıda ödeme miydi?
- Ayarlarda otomatik onay açık mı?
- Sipariş panelde beklemede veya gönderildi durumuna geçti mi?

### Ne yapmalı

1. Siparişin kapıda ödeme olduğunu doğrulayın.
2. Otomatik onayın açık olduğunu doğrulayın.
3. Geçerli olduğunu bildiğiniz bir numaraya test onayı gönderin.
4. Test çalışıyor ancak gerçek sipariş çalışmıyorsa sipariş verilerini ve zamanlama kurallarını gözden geçirin.

## Sorun: Mesaj gönderilmedi

### Neleri kontrol etmeli

- Mevcut plan kullanımı (`used / limit`).
- Paneldeki başarısız gönderimler.
- Gönderim gecikmesi ve sessiz saat ayarları.

### Ne yapmalı

1. Kullanım sınıra yakın veya dolmuşsa planınızı yükseltin ya da bir sonraki dönemi bekleyin. Bağımsız bir hesapta **Faturalandırma ve krediler** bölümünden kredi satın alın.
2. Başarısız durumu görünüyorsa müşterinin telefon numarasının doğruluğunu kontrol edin.
3. Gecikme varsa sessiz saatleri ve saat dilimi ayarlarını kontrol edin.

> [!WARNING]
> Plan sınırına ulaşılması bir gönderim kesintisi gibi görünebilir. Daha ayrıntılı incelemeye geçmeden önce her zaman kullanımı kontrol edin.

## Sorun: Müşteri mesajı almadığını söylüyor

### Neleri kontrol etmeli

- Telefon numarası biçimi ve ülke kodu.
- Durumun gönderildi, teslim edildi veya başarısız olup olmadığı.
- Müşterinin yanıt oranının düşük olduğu bir bölgede veya saat aralığında olup olmadığı.

### Ne yapmalı

1. Temiz ve geçerli olduğunu bildiğiniz bir numarayla yeniden test edin.
2. Şablonun dilini ve üslubunu müşteri kitlenize göre gözden geçirin.
3. Gözden kaçan ilk mesajları telafi etmek için hatırlatmaları kullanın.

## Sorun: Çok fazla yanıt yok siparişi

### Olası nedenler

- İlk gönderim gecikmesi çok uzun.
- Hatırlatma kapalı.
- Yanıt yok işaretleme süresi çok kısa.
- Mesajın üslubu veya dili müşteri kitlesine uygun değil.

### Ne yapmalı

1. İlk gönderim gecikmesini azaltın.
2. Hatırlatmayı açın.
3. Yanıt yok işaretleme süresini biraz uzatın.
4. Müşterilerinize daha uygun bir şablon üslubunu deneyin.

## Sorun: Otomatik onay kapalı görünüyor

### Neleri kontrol etmeli

- Ayarlardaki otomatik onay anahtarı.
- Kaydetme durumu (ayar değişikliği gerçekten kaydedildi mi?).
- Bir hatadan sonra yakın zamanda ayarların geri alınıp alınmadığı.

### Ne yapmalı

1. Otomatik onayı yeniden açın.
2. Kaydedin ve başarı mesajının göründüğünü doğrulayın.
3. Davranışı doğrulamak için bir test onayı gönderin.

## Sorun: Sessiz saatler mesajları çok fazla geciktiriyor

### Neleri kontrol etmeli

- Sessiz saatlerin başlangıç ve bitiş değerleri.
- Seçili saat dilimi.
- Sessiz saat aralığının, siparişlerinizin en yoğun olduğu dönemle çakışıp çakışmadığı.

### Ne yapmalı

1. Saat diliminin faaliyet gösterdiğiniz pazar için doğru olduğunu doğrulayın.
2. Gerekirse sessiz saat aralığını daraltın.
3. Gerçek bir siparişle yeniden test edin ve durumun zamanlamasını izleyin.

## Sorun: WooCommerce veya EasyOrders’dan siparişler gelmiyor

### Neleri kontrol etmeli

- **Ayarlar**’ı, ardından sipariş kaynağınızı açın ve bağlantı durumunu okuyun.
- WooCommerce’de bir sipariş bildiriminin devre dışı bırakılıp bırakılmadığını, duraklatılıp duraklatılmadığını veya silinip silinmediğini kontrol edin.
- EasyOrders’da mağazanın etkin olduğunu ve siparişlerin reddedilmediğini kontrol edin.

### Ne yapmalı

1. Durumun gösterdiği adımı izleyin: bildirimi yeniden etkinleştirin, webhook gizli anahtarlarını sıfırlayın ya da bağlantıyı kesip aynı mağazayı yeniden bağlayın.
2. Bağlantı kesikken verilen siparişleri elle onaylayın. Bu siparişler daha sonra içe aktarılmaz.
3. Her durum için [WooCommerce’i bağlama](/docs/woocommerce) veya [EasyOrders’ı bağlama](/docs/easyorders) kılavuzuna bakın.

## Sorun: İçe aktarılan siparişler onaylanmıyor

### Neleri kontrol etmeli

- Önizlemeden sonra **Gönder** düğmesine bastınız mı? Yalnızca içe aktarmak hiçbir şey göndermez.
- Siparişler hâlâ **Başlatılmayı bekliyor** durumunda mı? 24 saat içinde başlatılmaları gerekir.
- Kredi bittiği için içe aktarma duraklatıldı mı?
- Bazı satırlar geçersiz, yinelenen veya hariç tutulan olarak atlandı mı?

### Ne yapmalı

1. İçe aktarma ekranını açın ve atlanan her grubun yanındaki nedeni okuyun.
2. **Gönder** engelliyse kredi satın alın veya otomatik onayı açın, ardından yeniden **Gönder** düğmesine basın.
3. İçe aktarma duraklatıldıysa kredi satın alın ve **Devam et** seçeneğini seçin.
4. Süre geçtiyse ya da içe aktarmanın süresi dolduysa dosyayı yeniden yükleyin. Daha önce içe aktarılmış ve sipariş numarası olan siparişler tanınır ve yinelenmez; birbirine benzeyen siparişler ise incelemeniz için işaretlenir.

Dosya ve sütun sorunları için [Toplu Sipariş İçe Aktarma](/docs/bulk-order-import) kılavuzundaki sorun giderme tablosuna bakın.

## Sorun: Faturalandırma veya plan değişikliği sorunları

### Neleri kontrol etmeli

- Ayarlardaki mevcut faturalandırma durumu.
- Plan değişikliğinin Shopify’da onaylanıp onaylanmadığı (Shopify mağazaları).
- Paymob ödemenizin tamamlanıp tamamlanmadığı ve kredi bakiyenizin güncellenip güncellenmediği (bağımsız hesaplar).
- Kullanım düzeyi ile plana dahil sınır.

### Ne yapmalı

1. Onay tamamlanmadıysa plan değişikliğini yeniden deneyin.
2. Plan yükseltme reddedildiyse mevcut etkin planınızla devam edin.
3. Yoğun dönemlerde kesin kullanım sınırına ulaşmadan önce planınızı yükseltin.
4. Bağımsız bir hesapta bir ödeme beklemede görünüyorsa, yeniden ödeme yapmadan önce biraz bekleyin ve **Faturalandırma ve krediler** bölümünü kontrol edin.

## Destek Ekibiyle Ne Zaman İletişime Geçmeli

Şu durumlarda destek ekibiyle iletişime geçin:

- sorun, kontrol listesi ve soruna özel adımlardan sonra da devam ediyorsa,
- test mesajı da tekrar tekrar başarısız oluyorsa,
- faturalandırma durumu Shopify onayıyla tutarsız görünüyorsa ya da bir Paymob ödemesi kredi bakiyenizde görünmüyorsa.

Destek ekibiyle iletişime geçerken şunları ekleyin:

- mağaza adı,
- etkilenen sipariş numarası,
- durumun ekran görüntüsü,
- sorunun zamanı,
- daha önce neleri denediğiniz.

Bu, çözüm süresini önemli ölçüde kısaltır.

## SSS

### Hatalı bir yapılandırma değişikliğinden sonra performansı geri kazanabilir miyim?

Evet. Son kararlı ayarlara geri dönün, ardından her seferinde tek bir değişikliği yeniden test edin.

### Sorun giderirken otomasyonu kapatmalı mıyım?

Yalnızca risk kontrolü için gerekiyorsa. Çoğu durumda hedefe yönelik ayar düzeltmeleri yeterlidir.

### En hızlı sağlık kontrolü nedir?

Bir test onayı gönderin ve şunları doğrulayın:

- mesaj gönderildi,
- yanıt kaydedildi,
- durum panelde güncellendi.

Ayrıca bakın: [Başlarken](/docs/getting-started)
