import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchApprovedNames } from '../features/approvedNames/approvedNamesSlice';

const ApprovedNamesList = () => {
  const dispatch = useDispatch();
  const names = useSelector((state) => state.approvedNames.names);
  const status = useSelector((state) => state.approvedNames.status);
  const error = useSelector((state) => state.approvedNames.error);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchApprovedNames());
    }
  }, [status, dispatch]);

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Approved Names</h1>
      <ul>
        {names.map((name, index) => (
          <li key={index}>
            <strong>Approved Name:</strong> {name['Approved name']}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ApprovedNamesList;