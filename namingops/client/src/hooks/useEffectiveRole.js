import { useContext } from 'react';
import { useSelector } from 'react-redux';
import { DevRoleContext } from '../context/DevRoleContext';

/**
 * Hook returns the role that the UI should respect. In development this is either
 * the override role chosen via DevRoleContext or the authenticated role from Redux.
 * In production it simply returns the authenticated role.
 */
export const useEffectiveRole = () => {
  const devRole = useContext(DevRoleContext);
  const authRole = useSelector((state) => state.auth.role);
  return devRole ?? authRole;
};
