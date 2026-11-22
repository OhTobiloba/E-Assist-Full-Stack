// Shapes database rows into the JSON the frontend expects (lowercase enums, epoch-ms timestamps).
const r1 = (n) => Math.round(n * 10) / 10;

export function serializeUser(u) {
  return {
    id: u.id,
    phone: u.phone,
    name: u.name,
    email: u.email || '',
    photoUrl: u.photoUrl,
    homeArea: u.homeArea || '',
    roles: u.roles.map((r) => r.toLowerCase()),
    activeRole: u.activeRole ? u.activeRole.toLowerCase() : null,
    profileComplete: u.profileComplete,
    kycStatus: u.kycStatus.toLowerCase(),
  };
}

export const taskInclude = {
  customer: { select: { id: true, name: true, ratingAvg: true, ratingCount: true, _count: { select: { tasksAsCustomer: true } } } },
  assistant: { select: { id: true, name: true } },
};

export function serializeTask(t, distanceKm = null) {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    category: t.category,
    budget: t.budget,
    pickup: t.pickup,
    dropoff: t.dropoff,
    deadline: t.deadline.getTime(),
    photoUrl: t.photoUrl,
    proofUrl: t.proofUrl,
    status: t.status.toLowerCase(),
    escrowHeld: t.escrowHeld,
    customer: {
      id: t.customer.id,
      name: t.customer.name,
      rating: t.customer.ratingCount ? r1(t.customer.ratingAvg) : null,
      tasksPosted: t.customer._count?.tasksAsCustomer ?? 0,
    },
    assistant: t.assistant ? { id: t.assistant.id, name: t.assistant.name } : null,
    distanceKm,
    autoReleaseAt: t.autoReleaseAt ? t.autoReleaseAt.getTime() : null,
    createdAt: t.createdAt.getTime(),
  };
}

export const serializeNotification = (n) => ({
  id: n.id, title: n.title, body: n.body, taskId: n.taskId, read: n.read, createdAt: n.createdAt.getTime(),
});

export const serializeMessage = (m) => ({
  id: m.id, taskId: m.taskId, senderId: m.senderId, text: m.text, createdAt: m.createdAt.getTime(),
});
