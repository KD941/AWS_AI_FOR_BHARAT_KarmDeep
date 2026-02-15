import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Order } from '../../types';

const orderSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  vendorId: z.string().min(1, 'Vendor is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  totalAmount: z.number().min(0, 'Amount must be positive'),
  currency: z.string(),
  shippingAddress: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    country: z.string().min(1, 'Country is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
  }),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderFormProps {
  order?: Order;
  onSubmit: (data: Partial<Order>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function OrderForm({ order, onSubmit, onCancel, isLoading }: OrderFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: order || {
      quantity: 1,
      currency: 'USD',
      shippingAddress: {
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
        <div>
          <label className="label">Product ID *</label>
          <input {...register('productId')} className="input" disabled={!!order} />
          {errors.productId && (
            <p className="text-sm text-red-600 mt-1">{errors.productId.message}</p>
          )}
        </div>

        <div>
          <label className="label">Vendor ID *</label>
          <input {...register('vendorId')} className="input" disabled={!!order} />
          {errors.vendorId && (
            <p className="text-sm text-red-600 mt-1">{errors.vendorId.message}</p>
          )}
        </div>

        <div>
          <label className="label">Quantity *</label>
          <input
            type="number"
            {...register('quantity', { valueAsNumber: true })}
            className="input"
          />
          {errors.quantity && (
            <p className="text-sm text-red-600 mt-1">{errors.quantity.message}</p>
          )}
        </div>

        <div>
          <label className="label">Total Amount *</label>
          <input
            type="number"
            {...register('totalAmount', { valueAsNumber: true })}
            className="input"
          />
          {errors.totalAmount && (
            <p className="text-sm text-red-600 mt-1">{errors.totalAmount.message}</p>
          )}
        </div>

        <div>
          <label className="label">Currency</label>
          <select {...register('currency')} className="input">
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="INR">INR</option>
          </select>
        </div>

        <div className="col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Shipping Address</h3>
        </div>

        <div className="col-span-2">
          <label className="label">Street *</label>
          <input {...register('shippingAddress.street')} className="input" />
          {errors.shippingAddress?.street && (
            <p className="text-sm text-red-600 mt-1">{errors.shippingAddress.street.message}</p>
          )}
        </div>

        <div>
          <label className="label">City *</label>
          <input {...register('shippingAddress.city')} className="input" />
          {errors.shippingAddress?.city && (
            <p className="text-sm text-red-600 mt-1">{errors.shippingAddress.city.message}</p>
          )}
        </div>

        <div>
          <label className="label">State *</label>
          <input {...register('shippingAddress.state')} className="input" />
          {errors.shippingAddress?.state && (
            <p className="text-sm text-red-600 mt-1">{errors.shippingAddress.state.message}</p>
          )}
        </div>

        <div>
          <label className="label">Country *</label>
          <input {...register('shippingAddress.country')} className="input" />
          {errors.shippingAddress?.country && (
            <p className="text-sm text-red-600 mt-1">{errors.shippingAddress.country.message}</p>
          )}
        </div>

        <div>
          <label className="label">Postal Code *</label>
          <input {...register('shippingAddress.postalCode')} className="input" />
          {errors.shippingAddress?.postalCode && (
            <p className="text-sm text-red-600 mt-1">{errors.shippingAddress.postalCode.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="btn btn-primary">
          {isLoading ? 'Saving...' : order ? 'Update Order' : 'Create Order'}
        </button>
      </div>
    </form>
  );
}
