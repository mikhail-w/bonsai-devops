import { Avatar } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { cleanMediaPath } from '../../utils/urlUtils';

const UserAvatar = ({ userInfo }) => {
  if (!userInfo) return null;

  return (
    <RouterLink to="/profile">
      <Avatar
        src={
          userInfo.avatar
            ? cleanMediaPath(userInfo.avatar)
            : cleanMediaPath('default/avatar.jpg')
        }
        size="md"
        position="absolute"
        top="0px"
        right="70px"
        zIndex="5"
      />
    </RouterLink>
  );
};
export default UserAvatar;
