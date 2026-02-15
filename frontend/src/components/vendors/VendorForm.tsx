import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { VendorProfile } from '../../types';

const vendorSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    country: z.string().min(1, 'Country is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
  }),
  certifications: z.array(z.string()),
});

type VendorFormData = z.infer<typeof vendorSchema>;

interface VendorFormProps {
  vendor?: VendorProfile;
  onSubmit: (data: Partial<VendorProfile>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function VendorForm({ vendor, onSubmit, onCancel, isLoading }: VendorFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: vendor || {
      certifications: [],
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      },
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Company Name *</label>
          <input {...register('companyName')} className="input" />
          {errors.companyName && (
            <p className="text-sm text-red-600 mt-1">{errors.companyName.message}</p>
          )}
        </div>

        <div>
          <label className="label">Email *</label>
          <input type="email" {...register('email')} className="input" />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="label">Phone Number *</label>
          <input {...register('phoneNumber')} className="input" />
          {errors.phoneNumber && (
            <p className="text-sm text-red-600 mt-1">{errors.phoneNumber.message}</p>
          )}
        </div>

        <div className="col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Address</h3>
        </div>

        <div className="col-span-2">
          <label className="label">Street *</label>
          <input {...register('address.street')} className="input" />
          {errors.address?.street && (
            <p className="text-sm text-red-600 mt-1">{errors.address.street.message}</p>
          )}
        </div>

        <div>
          <label className="label">City *</label>
          <input {...register('address.city')} className="input" />
          {errors.address?.city && (
            <p className="text-sm text-red-600 mt-1">{errors.address.city.message}</p>
          )}
        </div>

        <div>
          <label className="label">State *</label>
          <input {...register('address.state')} className="input" />
          {errors.address?.state && (
            <p className="text-sm text-red-600 mt-1">{errors.address.state.message}</p>
          )}
        </div>

        <div>
          <label className="label">Country *</label>
          <input {...register('address.country')} className="input" />
          {errors.address?.country && (
            <p className="text-sm text-red-600 mt-1">{errors.address.country.message}</p>
          )}
        </div>

        <div>
          <label className="label">Postal Code *</label>
          <input {...register('address.postalCode')} className="input" />
          {errors.address?.postalCode && (
            <p className="text-sm text-red-600 mt-1">{errors.address.postalCode.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="btn btn-primary">
          {isLoading ? 'Saving...' : vendor ? 'Update Vendor' : 'Create Vendor'}
        </button>
      </div>
    </form>
  );
}
