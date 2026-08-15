import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PlanForm } from "@/components/admin/PlanForm";

export default async function EditPlanPage({ params }: { params: { id: string } }) {
  const plan = await prisma.membershipPlan.findUnique({ where: { id: params.id } });
  if (!plan) notFound();

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl text-gold-pale">Editar plan</h1>
      <PlanForm initial={plan} />
    </div>
  );
}
