import { Phone, Store, Package } from 'lucide-react'
import { useWaitlistForm } from '@/hooks/useWaitlistForm'
import { WaitlistError } from './waitlist/WaitlistError'
import { WaitlistSelectField } from './waitlist/WaitlistSelectField'
import { WaitlistSubmitButton } from './waitlist/WaitlistSubmitButton'
import { WaitlistSuccess } from './waitlist/WaitlistSuccess'
import { WaitlistTextField } from './waitlist/WaitlistTextField'

export function WaitlistForm() {
  const { t, form, isSubmitting, isSuccess, error, onSubmit } =
    useWaitlistForm()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form

  if (isSuccess) {
    return (
      <WaitlistSuccess
        title={t('success_title') || 'تم التسجيل بنجاح! 🎉'}
        info={t('info') || 'سنتواصل معك خلال 24 ساعة على الواتساب'}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && <WaitlistError message={t('error')} />}

      {/* Store Name */}
      <WaitlistTextField
        id="name"
        type="text"
        label={t('name.label')}
        placeholder={t('name.placeholder')}
        icon={<Store className="h-4 w-4 shrink-0 text-gray-500" />}
        register={register}
        errors={errors}
        required
      />

      {/* Phone Number */}
      <WaitlistTextField
        id="phone"
        type="tel"
        label={t('phone.label')}
        placeholder={t('phone.placeholder')}
        icon={<Phone className="h-4 w-4 shrink-0 text-gray-500" />}
        register={register}
        errors={errors}
        required
        dir="ltr"
      />

      {/* Platform */}
      <WaitlistTextField
        id="platform"
        type="text"
        label={t('platform.label')}
        placeholder={t('platform.placeholder')}
        icon={<Store className="h-4 w-4 shrink-0 text-gray-500" />}
        register={register}
        errors={errors}
      />

      {/* Monthly Orders */}
      <WaitlistSelectField
        control={control}
        errors={errors}
        label={t('monthlyOrders.label')}
        placeholder={t('monthlyOrders.placeholder')}
        icon={<Package className="h-4 w-4 shrink-0 text-gray-500" />}
        options={[
          { value: '0-50', label: t('monthlyOrders.options.0-50') },
          { value: '50-200', label: t('monthlyOrders.options.50-200') },
          { value: '200-500', label: t('monthlyOrders.options.200-500') },
          { value: '500-1000', label: t('monthlyOrders.options.500-1000') },
          { value: '1000+', label: t('monthlyOrders.options.1000+') },
        ]}
      />

      {/* Submit Button */}
      <WaitlistSubmitButton
        isSubmitting={isSubmitting}
        submitLabel={t('submit')}
        submittingLabel={t('submitting')}
        onSubmit={handleSubmit(onSubmit)}
      />
    </div>
  )
}
;('use client')
