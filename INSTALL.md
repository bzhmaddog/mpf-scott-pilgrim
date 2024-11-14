
# Update archlinux and install packages needed to build/install yay
```
sudo pacman -Syu
sudo pacman -S --needed base-devel git
```

# Install yay (needed for AUR packages like nvm)
```
git clone https://aur.archlinux.org/yay.git
cd yay && makepkg -si
```

# Install nvm
```
yay -Sy nvm
```

# Add nvm init to env and path
```
echo "source /usr/share/nvm/init-nvm.sh" > ~/.bashrc
```

# Install latest node version
```
source /usr/share/nvm/init-nvm.sh
nvm install node
```

# Install additionnal packages
```
yay -Sy docker docker-compose docker-buildx openssh samba htop nano wget vulkan-intel vulkan-tools xorg xorg-init chromium
```
