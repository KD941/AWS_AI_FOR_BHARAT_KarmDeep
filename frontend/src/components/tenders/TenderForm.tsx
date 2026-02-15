import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tender } from '../../types';

const tenderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  specifications: z.record(z.any()),
  commercialTerms: z.object({
    budget: z.number().min(0, 'Budget must be positive'),
    currency: z.string(),
    paymentTerms: z.string().min(1, 'Payment terms are required'),
  }),
  deadline: z.string().min(1, 'Deadline is required'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'AWARDED']),
});

type TenderFormData = z.infer<typeof tenderSchema>;

interface TenderFormProps {
  tender?: Tender;
  onSubmit: (data: Partial<Tender>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TenderForm({ tender, onSubmit, onCancel, isLoading }: TenderFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TenderFormData>({
    resolver: zodResolver(tenderSchema),
    defaultValues: tender || {
      status: 'DRAFT',
      commercialTerms: {
        currency: 'USD',
        paymentTerms: '',
      },
      specifications: {},
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Title *</label>
          <input {...register('title')} className="input" />
          {errors.title && (
            <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
          )}
        </div>

        <div className="col-span-2">
          <label className="label">Description *</label>
          <textarea {...register('description')} className="input" rows={4} />
          {errors.description && (
            <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="label">Budget *</label>
          <input
            type="number"
            {...register('commercialTerms.budget', { valueAsNumber: true })}
            className="input"
          />
          {errors.commercialTerms?.budget && (
            <p className="text-sm text-red-600 mt-1">{errors.commercialTerms.budget.message}</p>
          )}
        </div>

        <div>
          <label className="label">Currency</label>
          <select {...register('commercialTerms.currency')} className="input">
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="INR">INR</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="label">Payment Terms *</label>
          <textarea {...register('commercialTerms.paymentTerms')} className="input" rows={3} />
          {errors.commercialTerms?.paymentTerms && (
            <p className="text-sm text-red-600 mt-1">{errors.commercialTerms.paymentTerms.message}</p>
          )}
        </div>

        <div>
          <label className="label">Deadline *</label>
          <input type="date" {...register('deadline')} className="input" />
          {errors.deadline && (
            <p className="text-sm text-red-600 mt-1">{errors.deadline.message}</p>
          )}
        </div>

        <div>
          <label className="label">Status</label>
          <select {...register('status')} className="input">
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="CLOSED">Closed</option>
            <option value="AWARDED">Awarded</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="btn btn-primary">
          {isLoading ? 'Saving...' : tender ? 'Update Tender' : 'Create Tender'}
        </button>
      </div>
    </form>
  );
}
