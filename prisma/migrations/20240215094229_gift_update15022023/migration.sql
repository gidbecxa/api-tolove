-- AlterTable
ALTER TABLE `Gift` ADD COLUMN `giftCategory` ENUM('rose', 'mode_beaute', 'fitness_bien_etre', 'cuisine_gastronomie', 'bijoux_accessoires', 'art_creativite', 'musique', 'technologie_gadget', 'litterature_ecriture', 'jardinage', 'jeux_loisirs', 'sextoys', 'unclassified') NOT NULL DEFAULT 'unclassified';
