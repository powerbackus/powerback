import React, { useMemo, useReducer } from 'react';
import { Image } from 'react-bootstrap';
import { BACKUP_IMG } from '@CONSTANTS';
import './style.css';

type IconProps = {
  donee?:
    | {
        id: string;
        last_name: string;
        first_name: string;
      }
    | undefined;
  onHoldStatus?: string | null;
};

const Icon = ({ donee, onHoldStatus }: IconProps) => {
  const [backup, setBackup] = useReducer(() => true, false);

  const imgsrc = useMemo(() => {
    if (!donee?.id) return undefined;
    return backup ? BACKUP_IMG + donee.id + '.jpg' : `../pfp/${donee.id}.webp`;
  }, [donee, backup]);

  return (
    <div className={`icon-container ${!!onHoldStatus ? 'inactive' : ''}`}>
      {donee && imgsrc && (
        <Image
          src={imgsrc}
          loading={'lazy'}
          onError={setBackup}
          aria-label={'Politician profile picture'}
          title={`politician donee ${donee.first_name + ' ' + donee.last_name}`}
          alt={`The official Congressional headshot of ${
            donee.first_name + ' ' + donee.last_name
          }.`}
        />
      )}
    </div>
  );
};

export default React.memo(Icon);
