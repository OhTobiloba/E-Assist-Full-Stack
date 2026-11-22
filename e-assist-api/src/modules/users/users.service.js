import bcrypt from 'bcryptjs';
import { prisma } from '../../config/db.js';
import { uploadImage } from '../../config/cloudinary.js';
import { ApiError } from '../../utils/ApiError.js';
import { serializeUser } from '../../utils/serializers.js';

export async function updateProfile(user, { name, email, homeArea, password }, photoFile) {
  const data = {};
  if (name) data.name = name;
  if (email) data.email = email.toLowerCase();
  if (homeArea) data.homeArea = homeArea;
  if (password) data.passwordHash = await bcrypt.hash(password, 10);
  if (photoFile) {
    const up = await uploadImage(photoFile.buffer, { folder: 'e-assist/avatars' });
    if (up.secure_url) data.photoUrl = up.secure_url;
  }
  const merged = { ...user, ...data };
  data.profileComplete = !!(merged.name && merged.email && merged.homeArea);
  const updated = await prisma.user.update({ where: { id: user.id }, data });
  return serializeUser(updated);
}

// Body can contain `roles` (choose what you are) and/or `activeRole` (switch the current view)
export async function updateRole(user, { roles, activeRole }) {
  const nextRoles = roles ? roles.map((r) => r.toUpperCase()) : user.roles;
  let nextActive = activeRole ? activeRole.toUpperCase() : roles ? nextRoles[0] : user.activeRole;
  if (!nextRoles.includes(nextActive)) {
    if (activeRole) throw new ApiError(400, 'You have not enabled that role.');
    nextActive = nextRoles[0];
  }
  const updated = await prisma.user.update({ where: { id: user.id }, data: { roles: nextRoles, activeRole: nextActive } });
  return serializeUser(updated);
}
